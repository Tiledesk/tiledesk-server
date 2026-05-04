"use strict";

const EventEmitter = require('events');

class WebhookEvent extends EventEmitter {}

const webhookEvent = new WebhookEvent();

module.exports = webhookEvent;
