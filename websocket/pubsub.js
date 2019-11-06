const  Map  = require('immutable').Map;
var _ = require('lodash');

// import _ from 'lodash'
// import uuid from 'uuid/v1'
const uuidv4 = require('uuid/v4');

const Subscription = require('./subscription');
// console.log("Subscription", Subscription);

class PubSub {

  constructor (wss, onMessageCallbackArg) {
    //   console.log("wss", wss);
    this.wss = wss

    this.clients = new Map()
     this.subscription = new Subscription();

    this.load = this.load.bind(this)
    this.handleReceivedClientMessage = this.handleReceivedClientMessage.bind(
      this)
    this.handleAddSubscription = this.handleAddSubscription.bind(this)
    this.handleUnsubscribe = this.handleUnsubscribe.bind(this)
    this.handlePublishMessage = this.handlePublishMessage.bind(this)
    this.removeClient = this.removeClient.bind(this)
    
    this.onMessageCallback = onMessageCallbackArg;
      
    this.load()
  }

  load () {

    const wss = this.wss

    wss.on('connection', (ws) => {

      const id = this.autoId()

      console.log('connection', id)
      const client = {
        id: id,
        ws: ws,
        userId: null,
        subscriptions: [],
      }

      // add new client to the map
      this.addClient(client)

      // listen when receive message from client
      ws.on('message',
        (message) => this.handleReceivedClientMessage(id, message))

      ws.on('close', () => {
        console.log('Client is disconnected')
        // Find user subscriptions and remove
        const userSubscriptions = this.subscription.getSubscriptions(
          (sub) => sub.clientId === id)
        userSubscriptions.forEach((sub) => {
          this.subscription.remove(sub.id)
        })

        // now let remove client

        this.removeClient(id)

      })

    })

  }

  /**
   * Handle add subscription
   * @param topic
   * @param clientId = subscriber
   */
  handleAddSubscription (topic, clientId) {

    const client = this.getClient(clientId)
    if (client) {
      const subscriptionId = this.subscription.add(topic, clientId)
      client.subscriptions.push(subscriptionId)
      this.addClient(client)
    }

  }

  /**
   * Handle unsubscribe topic
   * @param topic
   * @param clientId
   */
  handleUnsubscribe (topic, clientId) {

    const client = this.getClient(clientId)

    let clientSubscriptions = _.get(client, 'subscriptions', [])

    const userSubscriptions = this.subscription.getSubscriptions(
      (s) => s.clientId === clientId && s.type === 'ws')

    userSubscriptions.forEach((sub) => {

      clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id)

      // now let remove subscriptions
      this.subscription.remove(sub.id)

    })

    // let update client subscriptions
    if (client) {
      client.subscriptions = clientSubscriptions
      this.addClient(client)
    }

  }

  /**
   * Handle publish a message to a topic
   * @param topic
   * @param message
   * @param from
   * @isBroadcast = false that mean send all, if true, send all not me
   */
  handlePublishMessage (topic, message, from, isBroadcast = false) {

    let subscriptions = isBroadcast
      ? this.subscription.getSubscriptions(
        (sub) => sub.topic === topic && sub.clientId !== from)
      : this.subscription.getSubscriptions(
        (subs) => subs.topic === topic)
    // now let send to all subscribers in the topic with exactly message from publisher
    subscriptions.forEach((subscription) => {

      const clientId = subscription.clientId
      const subscriptionType = subscription.type  // email, phone, ....
      console.log('CLient id of subscription', clientId, subscription)
      // we are only handle send via websocket
      if (subscriptionType === 'ws') {
        this.send(clientId, {
          action: 'publish',
          payload: {
            topic: topic,
            message: message,
          },
        })
      }

    })
  }

  /**
   * Handle receive client message
   * @param clientId
   * @param message
   */
  handleReceivedClientMessage (clientId, message) {

    if (this.onMessageCallback ) {
      this.onMessageCallback(clientId, message);
    }

    const client = this.getClient(clientId)
    console.log('clientId',clientId, message);
    if (typeof message === 'string') {

      message = this.stringToJson(message)

      const action = _.get(message, 'action', '')
      switch (action) {

        case 'me':

          //Client is asking for his info

          this.send(clientId,
            {action: 'me', payload: {id: clientId, userId: client.userId}})

          break

        case 'subscribe':

          //@todo handle add this subscriber
          const topic = _.get(message, 'payload.topic', null)
          if (topic) {
            this.handleAddSubscription(topic, clientId)

          }

          break

        case 'unsubscribe':

          const unsubscribeTopic = _.get(message, 'payload.topic')
          if (unsubscribeTopic) {

            this.handleUnsubscribe(unsubscribeTopic, clientId)
          }

          break

        case 'publish':

          const publishTopic = _.get(message, 'payload.topic', null)
          const publishMessage = _.get(message, 'payload.message')
          if (publishTopic) {
            const from = clientId
            this.handlePublishMessage(publishTopic, publishMessage, from)
          }

          break

        case 'broadcast':

          const broadcastTopicName = _.get(message, 'payload.topic', null)
          const broadcastMessage = _.get(message, 'payload.message')
          if (broadcastTopicName) {
            this.handlePublishMessage(broadcastTopicName, broadcastMessage,
              clientId, true)
          }

          break

        default:

          break
      }

    } else {
      // maybe data message we handle later.
    }

  }

  /**
   * Convert string of message to JSON
   * @param message
   * @returns {*}
   */
  stringToJson (message) {

    try {
      message = JSON.parse(message)
    } catch (e) {
      console.log(e, message)
    }

    return message
  }

  /**
   * Add new client connection to the map
   * @param client
   */
  addClient (client) {

    if (!client.id) {
      client.id = this.autoId()
    }
    this.clients = this.clients.set(client.id, client)
    console.log('clients added')
  }

  /**
   * Remove a client after disconnecting
   * @param id
   */
  removeClient (id) {
    this.clients = this.clients.remove(id)
  }

  /**
   * Get a client connection
   * @param id
   * @returns {V | undefined}
   */
  getClient (id) {

    return this.clients.get(id)
  }

  /**
   * Generate an ID
   * @returns {*}
   */
  autoId () {
    return uuidv4()
  }

  /**
   * Send to client message
   * @param message
   */
  send (clientId, message) {

    const client = this.getClient(clientId)
    if (!client) {
      return
    }
    const ws = client.ws
    try {
      message = JSON.stringify(message)
    }
    catch (err) {
      console.log('An error convert object message to string', err)
    }

    ws.send(message)
  }

}

// var pubSub = new PubSub();
module.exports = PubSub;
