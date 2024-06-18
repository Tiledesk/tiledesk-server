var winston = require('../config/winston');

// MODELS_MULTIPLIER = {
//     "gpt-3.5-turbo": 0.6,
//     "gpt-4": 25,
//     "gpt-4-turbo-preview": 12
// }

loadMultiplier();
function loadMultiplier() {
    

    let models_string = process.env.AI_MODELS;
    winston.debug("(loadMultiplier) models_string: ", models_string)
    let models = {};

    if (!models_string) {
        winston.info("AI_MODELS not defined");
        winston.info("AI Models: ", models)
        return models;
    }

    let models_string_trimmed = models_string.replace(/ /g,'');
    winston.debug("(loadMultiplier) models_string_trimmed: ", models_string_trimmed)

    let splitted_string = models_string_trimmed.split(";");
    winston.debug("splitted_string: ", splitted_string)

    splitted_string.forEach(m => {
        m_split = m.split(":");
        if (!m_split[1]) {
            multiplier = null;
        } else {
            multiplier = Number(m_split[1]);;
        }
        models[m_split[0]] = multiplier;
    })

    winston.info("AI Models: ", models)
    return models;
}

module.exports = { MODELS_MULTIPLIER: loadMultiplier() }