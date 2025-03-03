const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RowSchema = new Schema(
  {
    text: {
      type: String,
      required: true
    },
    level: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    }
  }
);

const FlowLogsSchema = new Schema(
  {
    id_project: {
      type: String,
      required: false,
    },
    request_id: {
      type: String,
      required: false,
    },
    level: {
      type: String,
      required: true,
    },
    rows: {
      type: [RowSchema],
      required: false,
    },
  }, {
    timestamps: true
  }
);

FlowLogsSchema.index({ request_id: 1 }, { unique: true });

// FlowLogsSchema.pre('findOneAndUpdate', async function (next) {
//   const update = this.getUpdate();

//   if (update.$push && update.$push.rows) {
//     const doc = await this.model.findOne(this.getQuery());

//     if (!doc) {
//       update.$push.rows.index = 0;
//     } else {
//       update.$push.rows.index = doc.rows.length;
//     }
//   }
//   next();
// });

const FlowLogs = mongoose.model('FlowLogs', FlowLogsSchema);

module.exports = { FlowLogs };
