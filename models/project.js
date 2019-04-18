var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');
var Profile = require('../models/profile');
var Channel = require('../models/channel');

var ProjectSchema = new Schema({
  _id: Schema.Types.ObjectId,

  name: {
    type: String,
    required: true
  },
  activeOperatingHours: {
    type: Boolean,
  },
  operatingHours: {
    type: Object,
  },
  settings: {
    type: Object,
  },
  widget: {
    type: Object,
  },
  publicKey: {
    type: String,
    select: false
  },
  privateKey: {
    type: String,
    select: false
  },
  jwtSecret: {
    type: String,
    select: false
  },
  profile: {
    type: Profile.schema,
    default: function() {
      return new Profile();
    }
  },
  // profile: {
  //   type: String,
  //   default: 'free',
  //   required: true
  // },
  // trialDays: {
  //   type: Number,
  //   default: 30
  // },
  versions: {
    type: Number,
    default: 30
  },
  channels: {
    type: [Channel.schema],
    default: function() {
      return [new Channel({name: 'chat21'})];
    }
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true,
  toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
}
);

ProjectSchema.virtual('trialExpired').get(function () {
  // https://stackoverflow.com/questions/6963311/add-days-to-a-date-object
  let now = new Date();
  winston.debug("now.getTime() " + now.getTime());
  winston.debug("this.createdAt.getTime() " + this.createdAt.getTime());
  winston.debug("this " , this.toObject());
  winston.debug("trial " + this.profile.trialDays *  86400000 );
  if (this.createdAt.getTime() + this.profile.trialDays *  86400000 > now.getTime()) {
    winston.debug("not expired");
    return false;
  } else {
    winston.debug("expired");
    return true;
  }
});

module.exports = mongoose.model('project', ProjectSchema);
