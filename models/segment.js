var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var winston = require('../config/winston');



var SegmentFilterSchema = new Schema({
    field: { //ex: email
        type: String,
        required: true,
        // index:true
      },
    operator: {
        type: String,
        required: true
    },
    value: { //tidio supports date, tag, dropdown
        //type: String,
        type: Object,
        required: true
    },
},{ _id : false });


var SegmentSchema = new Schema({

  name: {
    type: String,
    required: true,
    // index: true
  },
  match: {
    type: String,
    required: true,
    // index: 
    default: "all" //or any
  },
  filters: [SegmentFilterSchema],
  id_project: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: Number,
    default: 100,  
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  }
},{
  timestamps: true
}
);


var segment = mongoose.model('segment', SegmentSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
    segment.syncIndexes();
  winston.info("segment syncIndexes")
}

module.exports = segment;
