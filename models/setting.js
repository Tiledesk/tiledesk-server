var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var firebaseSettingSchema = require('../models/firebaseSetting').Schema;

var FirebaseSettingSchema = new Schema({
  

  private_key: {
    type: String,
    required: true,
    select: false
  },
  client_email: {
    type: String,
    required: true,
    select: false
  },
  project_id: {
    type: String,
    required: true,
    select: false
  },
  apiKey: {
    type: String,
    required: false,
  },
  authDomain: {
    type: String,
    required: false,
  },
  databaseURL: {
    type: String,
    required: false,
  },
  storageBucket: {
    type: String,
    required: false,
  },
  messagingSenderId: {
    type: String,
    required: false,
  },
  
}
// ,{
//   timestamps: true
// }
);

var SettingSchema = new Schema({
  

  firebase: FirebaseSettingSchema
}
// ,{
//   timestamps: true
// }
);

module.exports = mongoose.model('Setting', SettingSchema);
