const mongoose = require("mongoose");
const winston = require("./winston");
const MaskData = require("maskdata");
const config = require("./database");

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI || config.database;

if (!databaseUri) {
    winston.warn('(server.js) DATABASE_URI not specified, falling back to localhost.');
}

if (process.env.NODE_ENV == 'test') {
    databaseUri = config.databasetest;
}


const masked_databaseUri = MaskData.maskPhone(databaseUri, {
    maskWith: "*",
    unmaskedStartDigits: 15,
    unmaskedEndDigits: 5
});

if (process.env.DISABLE_MONGO_PASSWORD_MASK == true || process.env.DISABLE_MONGO_PASSWORD_MASK == "true") {
    winston.info("(server.js) DatabaseUri: " + databaseUri);
} else {
    winston.info("(server.js) DatabaseUri masked: " + masked_databaseUri);
}

var autoIndex = true;
if (process.env.MONGOOSE_AUTOINDEX) {
  autoIndex = process.env.MONGOOSE_AUTOINDEX;
}
winston.info("(server.js) DB AutoIndex: " + autoIndex);



async function connectDB() {
  try {

    try {
      await mongoose.connect(databaseUri, {
        autoIndex: autoIndex
      });
      mongoose.set('strictQuery', true);

      winston.info("Mongoose connection done on host: " + mongoose.connection.host + " on port: " + mongoose.connection.port + " with name: " + mongoose.connection.name);

      return mongoose.connection;
    } catch (err) {
      winston.error('Failed to connect to MongoDB on ' + databaseUri + " ", err);
      process.exit(1);
    }

  } catch (err) {
    winston.error("MongoDB connection error", err);
    throw err;
  }
}

module.exports = connectDB;