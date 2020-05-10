var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var routingConstants = require('../models/routingConstants');
var winston = require('../config/winston');

var DepartmentSchema = new Schema({
  // _id: Schema.Types.ObjectId,
  id_bot: {
    type: String,
    // required: true
  },
  bot_only: {
    type: Boolean,
    // required: true
  },
  routing: {
    type: String,
    default:routingConstants.POOLED,
    // required: true
  },
  name: {
    type: String,
    required: true,
    index:true
  },
  description: {
    type: String,
    // index:true
  },
  id_project: {
    type: String,
    required: true,
    index: true
  },
  id_group: {
    type: String,
  },
  // used??
  online_msg: {
    type: String,
  },
  offline_msg: {
    type: String,
  },
  default: {
    type: Boolean,
    default:false,
    index: true
    // required: true
  },
  status: {
    type: Number,
    default: 1,
    index: true
    // required: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true,
  toJSON: { virtuals: true }
}
);

DepartmentSchema.virtual('bot', {
  ref: 'faq_kb', // The model to use
  localField: 'id_bot', // Find people where `localField`
  foreignField: '_id', // is equal to `foreignField`
  justOne: true,
  //options: { sort: { name: -1 }, limit: 5 } // Query options, see http://bit.ly/mongoose-query-options
});

DepartmentSchema.virtual('hasBot').get(function () {
  if (this.id_bot!=undefined) {
    return true;
  }else {
    return false;
  }
});


// query = { default: true, id_project: projectid };
DepartmentSchema.index({ id_project: 1, default: 1 }); 

var department = mongoose.model('department', DepartmentSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  department.syncIndexes();
  winston.info("department syncIndexes")
}


module.exports = department;
