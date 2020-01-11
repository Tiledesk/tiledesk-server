const  Map  = require('immutable').Map;
// import uuid from 'uuid/v1'
const uuidv4 = require('uuid/v4');
var winston = require('../config/winston');

class Subscription {

  constructor () {

    this.subscriptions = new Map()
  }

  /**
   * Return subsciption
   * @param id
   */
  get (id) {
    return this.subscriptions.get(id)
  }

  /**
   * Add new subscription
   * @param topic
   * @param clientId
   * @param type
   * @returns {*}
   */
  add (topic, clientId, type = 'ws') {


    // need to find subscription with same type = 'ws'

    const findSubscriptionWithClientId = this.subscriptions.find(
      (sub) => sub.clientId === clientId && sub.type === type && sub.topic === topic)

    if (findSubscriptionWithClientId) {
      // exist and no need add more subscription
      return findSubscriptionWithClientId.id
    }
    const id = this.autoId()
    const subscription = {
      id: id,
      topic: topic,
      clientId: clientId,
      type: type, // email, phone
    }

    // winston.debug('New subscriber via add method:', subscription)
    this.subscriptions = this.subscriptions.set(id, subscription)
    // winston.debug('New subscribers',this.subscriptions);
    return id
  }

  /**
   * Remove a subsciption
   * @param id
   */
  remove (id) {

    this.subscriptions = this.subscriptions.remove(id)
  }

  /**
   * Clear all subscription
   */
  clear () {

    this.subscriptions = this.subscriptions.clear()
  }

  /**
   * Get Subscriptions
   * @param predicate
   * @returns {any}
   */
  getSubscriptions (predicate = null) {
    return predicate
    //   ? this.subscriptions
      ? this.subscriptions.filter(predicate)
      : this.subscriptions
  }

  /**
   * Generate new ID
   * @returns {*}
   */
  autoId () {
    return uuidv4()
  }
}

// var subscription = new Subscription();
module.exports = Subscription;