const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const winston = require('../config/winston');

const TableSchema = new Schema({
  id_project: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String, 
    required: true
  },
  schema: { 
    type: Schema.Types.Mixed, 
    default: [] 
  },
  createdBy: { 
    type: String, 
    required: true 
  },
  stats: {
    rows: {
      type: Number,
      default: 0
    },
    sizeBytes: {
      type: Number,
      default: 0
    }
  }
}, { 
  timestamps: true 
});

const TableRowSchema = new Schema({
  id_project: { 
    type: String, 
    required: true 
  },
  id_table: { 
    type: String, 
    required: true 
  },
  data: { 
    type: Schema.Types.Mixed, 
    default: {} 
  },
}, { 
  timestamps: true 
});

TableRowSchema.index({ id_project: 1, id_table: 1 });

const Table = mongoose.model('Table', TableSchema);
const TableRow = mongoose.model('TableRow', TableRowSchema);

if (process.env.MONGOOSE_SYNCINDEX) {
  TableRow.syncIndexes();
  winston.verbose('TableRow syncIndexes');
}

module.exports = { Table, TableRow };
