const  Map  = require('immutable').Map;
var _ = require('lodash');
//const util = require('util')

// import _ from 'lodash'
// import uuid from 'uuid/v1'
const uuidv4 = require('uuid/v4');

const Subscription = require('./subscription');
// winston.debug("Subscription", Subscription);
var winston = require('../config/winston');




// https://github.com/tabvn/pubsub/blob/master/server/src/pubsub.js
class PubSub {

    constructor (wss, callbacksArg) {
    winston.debug("wss", wss);

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
     
     this.callbacks = callbacksArg;

    this.load()
  }

   load() {

    const wss = this.wss

    wss.on('connection', async (ws,req) => {

      ws.isAlive = true;

      const id = this.autoId()

      winston.debug('connection', id)
      const client = {
        id: id,
        ws: ws,
        userId: null,
        subscriptions: [],
      }
     
      if (this.callbacks && this.callbacks.onConnect) {
        try {
          var resCallBack =  await await this.callbacks.onConnect(client, req);
          winston.debug("resCallBack onConnect",resCallBack);
        } catch(e) {
          winston.warn("resCallBack onConnect err",e);
          return 0;
        }        
      }

      // add new client to the map
      this.addClient(client)

     

      // listen when receive message from client
      ws.on('message',
        (message) => this.handleReceivedClientMessage(id, message, req))

      ws.on('close', async () => {
        winston.debug('Client is disconnected')

        clearInterval(ws.timer);
        
        // Find user subscriptions and remove
        const userSubscriptions = this.subscription.getSubscriptions(
          (sub) => sub.clientId === id)

       
        if (this.callbacks && this.callbacks.onDisconnect) {          
          try {
            var resCallBack =  await this.callbacks.onDisconnect(id, userSubscriptions);
            winston.debug("resCallBack onDisconnect",resCallBack);
          } catch(e) {
            winston.warn("resCallBack onDisconnect err",e);
            return 0;
          }

        }
    
        userSubscriptions.forEach((sub) => {
          this.subscription.remove(sub.id)
        })

        // now let remove client

        this.removeClient(id)

      })
      //https://stackoverflow.com/questions/46755493/websocket-ping-with-node-js
     // ws.on('pong',function(mess) { winston.debug(ws.id+' receive a pong : '+mess); });

      var thatThis = this;
      //winston.debug("heartbeat timer");
      ws.timer=setInterval(function(){thatThis.ping(ws);},30000);

    })

  }

  ping(ws) {
    winston.debug('send a ping');
    if (ws.isAlive === false) {
      winston.debug('ws.isAlive is false terminating ws');
      return ws.terminate();
    }
    //ws.ping('coucou',{},true);
    ws.isAlive = false;
    // {
    //   action: 'publish',
    //   payload: {
    //     topic: topic,
    //     method: method,
    //     message: message,
    //   },
    // })
    var message = {action: "heartbeat", payload: {message: {text: "ping"}}};
    ws.send(JSON.stringify(message));
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
      winston.debug('handleAddSubscription this.subscription',JSON.stringify(this.subscription));
      
      client.subscriptions.push(subscriptionId)      
      this.addClient(client)


      // const client = {
      //   id: id,
      //   ws: ws,
      //   userId: null,
      //   subscriptions: [],
      // }
     
     
      //winston.debug('handleAddSubscription this.addClient',JSON.stringify(this.clients));
    }

  }

  /**
   * Handle unsubscribe topic
   * @param topic
   * @param clientId
   */
  handleUnsubscribe (topic, clientId) {

    const client = this.getClient(clientId)

    winston.debug('handleUnsubscribe client.id', client.id, "subscriptions", client.subscriptions);


    let clientSubscriptions = _.get(client, 'subscriptions', [])
    //winston.debug('handleUnsubscribe clientSubscriptions',clientSubscriptions);

    const userSubscriptions = this.subscription.getSubscriptions(
      (s) => s.clientId === clientId && s.type === 'ws')

    winston.debug('handleUnsubscribe userSubscriptions',JSON.stringify(userSubscriptions));
    //winston.debug(util.inspect(userSubscriptions, {showHidden: false, depth: null}))

    userSubscriptions.forEach((sub) => {
      //clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id);
      //winston.debug('handleUnsubscribe clientSubscriptions',clientSubscriptions);
      // now let remove subscriptions
      winston.debug("handleUnsubscribe  sub.topic",sub.topic);
      winston.debug("handleUnsubscribe  topic",topic);

      if (sub.topic == topic) {
        winston.debug("handleUnsubscribe  remove",sub.id);
        var index = clientSubscriptions.indexOf(sub.id);
        winston.debug("handleUnsubscribe  index",index);
        if (index > -1) {
          clientSubscriptions.splice(index, 1);
        }
        //clientSubscriptions = clientSubscriptions.remove(sub.id);

        this.subscription.remove(sub.id)
      }
      
    })

    // userSubscriptions.forEach((sub) => {
    //   clientSubscriptions = clientSubscriptions.filter((id) => id !== sub.id);
    //   winston.debug('handleUnsubscribe clientSubscriptions',clientSubscriptions);
    //   // now let remove subscriptions
    //   this.subscription.remove(sub.id)
    // })
    winston.debug('handleUnsubscribe clientSubscriptions',clientSubscriptions);
     winston.debug('handleUnsubscribe this.subscription', JSON.stringify(this.subscription));

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
  handlePublishMessage (topic, message, from, isBroadcast = false, method) {
  

    let subscriptions = isBroadcast
      ? this.subscription.getSubscriptions(
        (sub) => sub.topic === topic && sub.clientId !== from)
      : this.subscription.getSubscriptions(
        (subs) => subs.topic === topic)


        winston.debug("handlePublishMessage!!!!!!!!!!!", subscriptions);    
    // now let send to all subscribers in the topic with exactly message from publisher
    subscriptions.forEach((subscription) => {

      const clientId = subscription.clientId
      const subscriptionType = subscription.type  // email, phone, ....
      // winston.debug('CLient id of subscription', clientId, subscription)
      // we are only handle send via websocket
      if (subscriptionType === 'ws') {
        this.send(clientId, {
          action: 'publish',
          payload: {
            topic: topic,
            method: method,
            message: message,
          },
        })
      }

    })
  }




  /**
   * Handle publish a message to a topic
   * @param topic
   * @param message
   * @param from
   * @isBroadcast = false that mean send all, if true, send all not me
   */
  handlePublishMessageToClientId (topic, message, clientId, method) {
  
        this.send(clientId, {
          action: 'publish',
          payload: {
            topic: topic,
            method: method,
            message: message,
          },
        })
      

  }

  /**
   * Handle receive client message
   * @param clientId
   * @param message
   */
  async handleReceivedClientMessage (clientId, message, req) {
/*
    if (this.onMessageCallback ) {
      this.onMessageCallback(clientId, message);
    }*/
    if (this.callbacks && this.callbacks.onMessage) {      
      try {
        var resCallBack =  await this.callbacks.onMessage(clientId, message);
        winston.debug("resCallBack onMessage",resCallBack);
      } catch(e) {
        winston.warn("resCallBack onMessage err",e);
        return 0;
      }
    }

    const client = this.getClient(clientId)
    // winston.debug('clientId',clientId, message);

      //heartbeat
      const ws = client.ws
      ws.isAlive = true;
   


    if (typeof message === 'string') {

      message = this.stringToJson(message)

      const action = _.get(message, 'action', '')
      switch (action) {

        case 'me':

          //Client is asking for his info

          this.send(clientId,
            {action: 'me', payload: {id: clientId, userId: client.userId}})

          break

        case 'heartbeat':
          
          const text = _.get(message, 'payload.message.text', null);
          winston.debug('received heartbeat with text ',text);
          if (text=='ping') {
            var messageToSend = {action: 'heartbeat', payload: {message: {text: 'pong'}}};
            // rispondi pong solo su ping e non su pong
            winston.debug('received heartbeat from ',clientId," i send a  message: ",  messageToSend);         
            this.send(clientId, messageToSend)
                
            
          }
            

        break

        case 'subscribe':

          //@todo handle add this subscriber
          const topic = _.get(message, 'payload.topic', null)
          if (topic) {

            if (this.callbacks && this.callbacks.onSubscribe) {
              try {
                var resCallBack =  await this.callbacks.onSubscribe(topic, clientId, req);
                winston.debug("resCallBack onSubscribe",resCallBack);
                //console.log("resCallBack onSubscribe",resCallBack);
              } catch(e) {
                winston.verbose("resCallBack onSubscribe err",e);
                return 0;
              }
            }

            this.handleAddSubscription(topic, clientId);


            if (resCallBack.publishFunction) {
              resCallBack.publishFunction();
            }

            

            // if (resCallBack.publishPromise) {
            //   resCallBack.publishPromise.then(function(resultPublish){
            //     // winston.info("resCallBack resultPublish",resultPublish);
            //     console.log("resCallBack resultPublish",resultPublish);
            //     // resultPublish.then(function(resultPublish2){
            //     //   winston.info("resCallBack resultPublish2",resultPublish2);
            //     //   console.log("resCallBack resultPublish2",resultPublish2);
            //     // });

            //   });
            // }
           


          }

          break

        case 'unsubscribe':

          const unsubscribeTopic = _.get(message, 'payload.topic')

         

          if (unsubscribeTopic) {

            if (this.callbacks && this.callbacks.onUnsubscribe) {              
              try {
                var resCallBack =  await this.callbacks.onUnsubscribe(unsubscribeTopic, clientId, req);
                winston.debug("resCallBack onUnsubscribe",resCallBack);
              } catch(e) {
                winston.warn("resCallBack onUnsubscribe err",e);
                return 0;
              }
            }

            this.handleUnsubscribe(unsubscribeTopic, clientId)
          }

          break

        case 'publish':

          const publishTopic = _.get(message, 'payload.topic', null)
          const publishMessage = _.get(message, 'payload.message')
          if (publishTopic) {
            const from = clientId;

            if (this.callbacks && this.callbacks.onPublish) {              
              try {
                var resCallBack =  await this.callbacks.onPublish(publishTopic, publishMessage, from, req);
                winston.debug("resCallBack onPublish",resCallBack);
              } catch(e) {
                winston.warn("resCallBack onPublish err",e);
                return 0;
              }
            }

            this.handlePublishMessage(publishTopic, publishMessage, from)
          }

          break

        case 'broadcast':

          const broadcastTopicName = _.get(message, 'payload.topic', null)
          const broadcastMessage = _.get(message, 'payload.message')
          if (broadcastTopicName) {
            if (this.callbacks && this.callbacks.onBroadcast) {              
              try {
                var resCallBack =  await this.callbacks.onBroadcast(broadcastTopicName, broadcastMessage, clientId, req);
                winston.debug("resCallBack onPublish",resCallBack);
              } catch(e) {
                winston.warn("resCallBack onPublish err",e);
                return 0;
              }
            }

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
      winston.debug(e, message)
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
    winston.debug('client added', {id: client.id, subscriptions: client.subscriptions});
    this.clients = this.clients.set(client.id, client)
     winston.debug('clients added: ',this.clients)
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
      winston.debug('An error convert object message to string', err)
    }

    ws.send(message)
  }

}

// var pubSub = new PubSub();
module.exports = PubSub;
