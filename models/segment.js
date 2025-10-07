let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let winston = require('../config/winston');



let SegmentFilterSchema = new Schema({
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


let SegmentSchema = new Schema({

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


let segment = mongoose.model('segment', SegmentSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
    segment.syncIndexes();
  winston.verbose("segment syncIndexes")
}

module.exports = segment;
