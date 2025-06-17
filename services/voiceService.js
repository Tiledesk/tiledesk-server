let elevenlabs_endpoint = process.env.ELEVENLABS_ENDPOINT || "https://api.elevenlabs.io";

class VoiceService {

    getVoices(key, next_page_token) {
        return new Promise((resolve, reject) => {

            axios({
                url: elevenlabs_endpoint + "/v2/voices",
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': key
                },
                params: {
                    page_size: 100,
                    ...(next_page_token && { next_page_token })
                }
            }).then((res) => {
                resolve(res.data);
            }).catch((err) => {
                reject(err);
            })
        })
    }

    getModels(key) {
        return new Promise((resolve, reject) => {
            axios({
                url: elevenlabs_endpoint + "/v1/models",
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': key
                }
            }).then((res) => {
                resolve(res.data);
            }).catch((err) => {
                reject(err);
            })
        })
    }


}

let voiceService = new VoiceService();

module.exports = voiceService;