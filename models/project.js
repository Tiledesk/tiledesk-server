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
    default: function () {
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
    default: function () {
      return [new Channel({ name: 'chat21' })];
    }
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
    timestamps: true,
    toJSON: { virtuals: true } //used to polulate messages in toJSON// https://mongoosejs.com/docs/populate.html
  }
);

ProjectSchema.virtual('trialExpired').get(function () {
  // https://stackoverflow.com/questions/6963311/add-days-to-a-date-object
  let now = new Date();
  winston.debug("now.getTime() " + now.getTime());
  winston.debug("this.createdAt.getTime() " + this.createdAt.getTime());
  winston.debug("this ", this.toObject());
  winston.debug("trial " + this.profile.trialDays * 86400000);
  if (this.createdAt.getTime() + this.profile.trialDays * 86400000 >= now.getTime()) {
    winston.debug("not expired");
    return false;
  } else {
    winston.debug("expired");
    return true;
  }
});

ProjectSchema.virtual('trialDaysLeft').get(function () {
  // https://stackoverflow.com/questions/6963311/add-days-to-a-date-object
  let now = new Date();
  winston.debug("trialDaysLeft now.getTime() " + now.getTime());
  winston.debug("trialDaysLeft this.createdAt.getTime() " + this.createdAt.getTime());
  winston.debug("trialDaysLeft this ", this.toObject());
  winston.debug("trialDaysLeft trial " + this.profile.trialDays * 86400000);

  const millisTrialDaysLeft = now.getTime() - (this.createdAt.getTime() + this.profile.trialDays * 86400000);
  const trialDaysLeft = Math.floor(millisTrialDaysLeft / (60 * 60 * 24 * 1000));

  winston.debug("trialDaysLeft now.getTime() " + now.getTime());
  winston.debug("trialDaysLeft this.createdAt.getTime() " + this.createdAt.getTime());
  winston.debug("trialDaysLeft ", millisTrialDaysLeft);
  winston.debug("trialDaysLeft - PROJECT NAME " + this.name + '; CREATED at ' + this.createdAt + ' -- trialDaysLeft: ', trialDaysLeft);
  return trialDaysLeft
  // return -8

});

ProjectSchema.virtual('isActiveSubscription').get(function () {

  let now = new Date();
  winston.debug("isActiveSubscription - now.getTime() " + now.getTime());

  winston.debug("isActiveSubscription  - PROJECT NAME: " + this.name);
  winston.debug("isActiveSubscription  - PROJECT profile " + this.profile);
  winston.debug("isActiveSubscription  - PROJECT profile trialDays: " + this.profile.trialDays);
  winston.debug("isActiveSubscription  - PROJECT profile name: " + this.profile.name);
  winston.debug("isActiveSubscription  - PROJECT profile type: " + this.profile.type);
  winston.debug("isActiveSubscription  - PROJECT profile subscription end date: " + this.profile.subEnd);
  winston.debug("isActiveSubscription  -  this.activeOperatingHours: " + this.activeOperatingHours);
  var isActiveSubscription = '';
  if (this.profile && this.profile.type === 'payment') {

    if (this.profile.subEnd) {
      winston.debug("isActiveSubscription  - PROJECT profile subscription end date getTime(): " + this.profile.subEnd.getTime());

      var subEndPlus3gg = this.profile.subEnd.getTime() + 259200000
      winston.debug("isActiveSubscription  - PROJECT profile subscription end date getTime() + 3gg: " + subEndPlus3gg);

      // FOR DEBUG 
      var subEndMinus3gg = this.profile.subEnd.getTime() - 259200000
      winston.debug("isActiveSubscription  - PROJECT profile subscription end date getTime() - 3gg: " + subEndMinus3gg);

      // + 259200000 
      if (now.getTime() > (this.profile.subEnd.getTime() + 259200000)) {
        isActiveSubscription = false;
      } else {
        isActiveSubscription = true;
      }
    }
  } else {
    isActiveSubscription = false;
  }

  winston.debug("isActiveSubscription  - isActiveSubscription " + isActiveSubscription);

  return isActiveSubscription

});



module.exports = mongoose.model('project', ProjectSchema);
