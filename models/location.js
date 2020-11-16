var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');

var LocationSchema = new Schema({
  country: {
    type: String,
    required: false,
    index: true
  },
  city: {
    type: String,
    required: false,
    index: true
  },
  streetAddress: {
    type: String,
    required: false,
    index: true
  },
  region: {
    type: String,
    required: false,
    index: true
  },
  zipcode: {
    type: String, 
    required: false,
    index: true
  },
  ipAddress: {
    type: String, 
    required: false,
    index: true
  },
  // https://mongoosejs.com/docs/geojson.html
  geometry: {
    type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    },    
    // index: '2dsphere' // Create a special 2dsphere index on `City.location`
  }  
},{ _id : false }
);


module.exports = LocationSchema;
