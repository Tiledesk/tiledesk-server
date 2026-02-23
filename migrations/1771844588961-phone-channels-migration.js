var winston = require('../config/winston');
const Request = require('../models/request');

const VOICE_CHANNEL_NAMES = ['voice-twilio', 'voice-vxml', 'voice-vxml-enghouse'];

async function up() {
  try {
    // Voice channels
    const voiceFilter = {
      'channel.name': { $in: VOICE_CHANNEL_NAMES },
      'attributes.caller_phone': { $exists: true, $nin: [null, ''] }
    };
    const voiceResult = await Request.updateMany(
      voiceFilter,
      [{ $set: { 'contact.phone': '$attributes.caller_phone' } }]
    );
    winston.info(
      `[phone-channels-migration] Voice channels: matched ${voiceResult.matchedCount}, modified ${voiceResult.modifiedCount}`
    );

    // WhatsApp
    const wabFilter = {
      'channel.name': 'whatsapp',
      createdBy: { $regex: /^wab-/ }
    };
    const wabResult = await Request.updateMany(wabFilter, [
      { $set: { 'contact.phone': { $replaceOne: { input: '$createdBy', find: 'wab-', replacement: '' } } } }
    ]);
    winston.info(
      `[phone-channels-migration] WhatsApp: matched ${wabResult.matchedCount}, modified ${wabResult.modifiedCount}`
    );

    // SMS-Twilio
    const smsFilter = {
      'channel.name': 'sms-twilio',
      createdBy: { $regex: /^sms-twilio-/ }
    };
    const smsResult = await Request.updateMany(smsFilter, [
      { $set: { 'contact.phone': { $replaceOne: { input: '$createdBy', find: 'sms-twilio-', replacement: '' } } } }
    ]);
    winston.info(
      `[phone-channels-migration] SMS-Twilio: matched ${smsResult.matchedCount}, modified ${smsResult.modifiedCount}`
    );
  } catch (err) {
    winston.error('[phone-channels-migration] Error:', err);
    throw err;
  }
}

module.exports = { up };
