const axios = require("axios").default;

class FileUtils {

    async downloadFromUrl(url) {

        return new Promise((resolve, reject) => {

            axios({
              url: url,
              responseType: 'arraybuffer',
              method: 'GET'
            }).then((resbody) => {
              resolve(resbody.data);
            }).catch((err) => {
              reject(err);
            })
      
          })
      
    }
}

let fileUtils = new FileUtils();

module.exports = fileUtils;