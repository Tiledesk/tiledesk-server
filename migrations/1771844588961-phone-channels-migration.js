var winston = require('../config/winston');
const Request = require('../models/request');
const phoneUtil = require('../utils/phoneUtil');

const VOICE_TWILIO_CHANNEL_NAMES = ['voice_twilio', 'voice-twilio'];
const VOICE_VXML_CHANNEL_NAMES = ['voice-vxml', 'voice-vxml-enghouse'];
const BATCH_SIZE = 100;

function getPhoneFromVoiceTwilioCreatedBy(createdBy) {
  if (!createdBy || typeof createdBy !== 'string') return null;
  if (createdBy.startsWith('voice-twilio-')) return createdBy.replace(/^voice-twilio-/, '');
  if (createdBy.startsWith('voice_twilio-')) return createdBy.replace(/^voice_twilio-/, '');
  return null;
}

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
    // Voice Twilio (voice-twilio / voice_twilio: phone from createdBy as "voice-twilio-{phone}" or "voice_twilio-{phone}")
    const voiceFilter = {
      'channel.name': { $in: VOICE_TWILIO_CHANNEL_NAMES },
      createdBy: { $regex: /^(voice-twilio-|voice_twilio-)/ }
    };
    const voiceResult = await updateManyWithNormalizedPhone(voiceFilter, (doc) =>
      getPhoneFromVoiceTwilioCreatedBy(doc.createdBy)
    );
    winston.info(
      `[phone-channels-migration] Voice Twilio: matched ${voiceResult.matched}, modified ${voiceResult.modified}`
    );

    // Voice VXML (voice-vxml / voice-vxml-enghouse: phone from attributes.caller_phone)
    const voiceVxmlFilter = {
      'channel.name': { $in: VOICE_VXML_CHANNEL_NAMES },
      'attributes.caller_phone': { $exists: true, $nin: [null, ''] }
    };
    const voiceVxmlResult = await updateManyWithNormalizedPhone(voiceVxmlFilter, (doc) => doc.attributes?.caller_phone);
    winston.info(
      `[phone-channels-migration] Voice VXML: matched ${voiceVxmlResult.matched}, modified ${voiceVxmlResult.modified}`
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
