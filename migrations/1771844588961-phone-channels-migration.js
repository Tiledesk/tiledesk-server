var winston = require('../config/winston');
const Request = require('../models/request');
const phoneUtil = require('../utils/phoneUtil');

const VOICE_CHANNEL_NAMES = ['voice-twilio', 'voice-vxml', 'voice-vxml-enghouse'];
const BATCH_SIZE = 100;

async function updateManyWithNormalizedPhone(filter, getPhoneFromDoc) {
  let matched = 0;
  let modified = 0;
  const cursor = Request.find(filter).select('_id attributes createdBy').lean().cursor();
  let batch = [];
  for await (const doc of cursor) {
    const rawPhone = getPhoneFromDoc(doc);
    if (rawPhone == null || String(rawPhone).trim() === '') continue;
    matched++;
    const normalized = phoneUtil.normalizePhone(rawPhone);
    const value = normalized != null && normalized !== '' ? normalized : String(rawPhone).trim();
    if (value === '') continue;
    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { 'contact.phone': value } }
      }
    });
    if (batch.length >= BATCH_SIZE) {
      const result = await Request.bulkWrite(batch);
      modified += result.modifiedCount;
      batch = [];
    }
  }
  if (batch.length > 0) {
    const result = await Request.bulkWrite(batch);
    modified += result.modifiedCount;
  }
  return { matched, modified };
}

async function up() {
  try {
    // Voice channels
    const voiceFilter = {
      'channel.name': { $in: VOICE_CHANNEL_NAMES },
      'attributes.caller_phone': { $exists: true, $nin: [null, ''] }
    };
    const voiceResult = await updateManyWithNormalizedPhone(voiceFilter, (doc) => doc.attributes?.caller_phone);
    winston.info(
      `[phone-channels-migration] Voice channels: matched ${voiceResult.matched}, modified ${voiceResult.modified}`
    );

    // WhatsApp
    const wabFilter = {
      'channel.name': 'whatsapp',
      createdBy: { $regex: /^wab-/ }
    };
    const wabResult = await updateManyWithNormalizedPhone(wabFilter, (doc) =>
      doc.createdBy && doc.createdBy.startsWith('wab-') ? doc.createdBy.replace(/^wab-/, '') : null
    );
    winston.info(
      `[phone-channels-migration] WhatsApp: matched ${wabResult.matched}, modified ${wabResult.modified}`
    );

    // SMS-Twilio
    const smsFilter = {
      'channel.name': 'sms-twilio',
      createdBy: { $regex: /^sms-twilio-/ }
    };
    const smsResult = await updateManyWithNormalizedPhone(smsFilter, (doc) =>
      doc.createdBy && doc.createdBy.startsWith('sms-twilio-') ? doc.createdBy.replace(/^sms-twilio-/, '') : null
    );
    winston.info(
      `[phone-channels-migration] SMS-Twilio: matched ${smsResult.matched}, modified ${smsResult.modified}`
    );
  } catch (err) {
    winston.error('[phone-channels-migration] Error:', err);
    throw err;
  }
}

module.exports = { up };
