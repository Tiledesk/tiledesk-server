'use strict';

/**
 * Optional deletes on the Chat21 MongoDB (conversations + messages collections).
 *
 * Enabled only when MONGODB_URI_CHAT21 is set (non-empty). The URI must already
 * include the target database, e.g. mongodb://mongo/chat21 — no useDb on the main connection.
 *
 * Collection / field names remain overridable via RETENTION_SECONDARY_* env vars.
 */

const mongoose = require('mongoose');
const winston = require('../../config/winston');

/** Singleton mongoose.createConnection(MONGODB_URI_CHAT21). */
let chat21Conn = null;

function getChat21Uri() {
    const uri = process.env.MONGODB_URI_CHAT21;
    return typeof uri === 'string' ? uri.trim() : '';
}

function isEnabled() {
    return getChat21Uri().length > 0;
}

/**
 * Deletes documents in the Chat21 DB tied to this Tiledesk request.
 */
async function deleteByRequestId(recipient_id, id_project) {
    if (!isEnabled()) {
        return;
    }

    const uri = getChat21Uri();

    if (!chat21Conn) {
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: process.env.MONGOOSE_UNIFIED_TOPOLOGY === 'true',
            useFindAndModify: false
        };
        chat21Conn = mongoose.createConnection(uri, opts);
        chat21Conn.on('error', (err) => {
            winston.error('Chat21 MongoDB (MONGODB_URI_CHAT21) connection error', err);
        });
    }

    if (chat21Conn.readyState !== 1) {
        winston.info("Chat21 MongoDB (MONGODB_URI_CHAT21) connection not ready, waiting for connection");
        await new Promise((resolve, reject) => {
            if (chat21Conn.readyState === 1) {
                winston.info("Chat21 MongoDB (MONGODB_URI_CHAT21) connection ready");
                return resolve();
            }
            chat21Conn.once('open', resolve);
            chat21Conn.once('error', (err) => {
                reject(err);
            });
        });
    }

    const nativeDb = chat21Conn.db;
    if (!nativeDb) {
        winston.warn('Chat21 retention: skip delete (no DB handle)', { recipient_id });
        return;
    }

    const conversationsColl = process.env.RETENTION_SECONDARY_CONVERSATIONS_COLLECTION || 'conversations';
    const messagesColl = process.env.RETENTION_SECONDARY_MESSAGES_COLLECTION || 'messages';
    const conversationIdField = process.env.RETENTION_SECONDARY_CONVERSATION_ID_FIELD || 'recipient';
    const messageConversationField = process.env.RETENTION_SECONDARY_MESSAGE_CONVERSATION_FIELD || 'recipient';

    const convFilter = { [conversationIdField]: recipient_id };
    const msgFilter = { [messageConversationField]: recipient_id };
    // if (process.env.RETENTION_SECONDARY_FILTER_BY_PROJECT === 'true' && id_project) {
    //     convFilter.id_project = id_project;
    //     msgFilter.id_project = id_project;
    // }

    try {
        const msgRes = await nativeDb.collection(messagesColl).deleteMany(msgFilter);
        const convRes = await nativeDb.collection(conversationsColl).deleteMany(convFilter);
        winston.info('Chat21 MongoDB retention delete', {
            recipient_id,
            id_project,
            messagesDeleted: msgRes.deletedCount,
            conversationsDeleted: convRes.deletedCount
        });
        // winston.info('Chat21 MongoDB retention delete', {
        //     recipient_id,
        //     id_project,
        //     messagesDeleted: msgRes.deletedCount,
        //     conversationsDeleted: convRes.deletedCount
        // });
    } catch (err) {
        winston.error('Chat21 MongoDB retention delete failed', { recipient_id, err });
        if (process.env.RETENTION_SECONDARY_STRICT === 'true') {
            throw err;
        }
    }
}

module.exports = {
    isEnabled,
    deleteByRequestId
};
