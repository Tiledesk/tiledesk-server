var winston = require('../config/winston');
var mongoose = require('mongoose');



 function removeRetentionIndex(name) {
        mongoose.connection.db.collection(name)

            .dropIndex( { "uploadDate": 1 },
                      

                          (err, result) => {
            if (err) {
                winston.error('Error removing index with name ' + name, err);
                return;
            }

            winston.info('Index ' + name +'  removed successfully:', result);
        });
    }

async function up () {
 winston.info('Index files and images removing');

 removeRetentionIndex("files.files");
  removeRetentionIndex("files.chunks");
  removeRetentionIndex("images.files");
  removeRetentionIndex("images.chunks");

  
}

module.exports = { up }; 