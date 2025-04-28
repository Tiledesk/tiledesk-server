module.exports = {
    chatbot: {
        default: 'blank',
        templates: ['empty', 'blank', 'handoff', 'example']
    },
    webhook: {
        default: 'blank_webhook',
        templates: ['empty', 'blank_webhook']
    },
    copilot: {
        default: 'official_copilot',
        templates: ['empty', 'blank_copilot', 'official_copilot']
    },
    voice: {
        default: 'blank_voice',
        templates: ['empty', 'blank_voice']
    },
    voice_twilio: {
        default: 'blank_voice_twilio',
        templates: ['empty', 'blank_voice_twilio']
    }
}
