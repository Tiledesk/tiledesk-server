const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TableSchema = new Schema({
  id_project: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  schema: {
    type: Object,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  }
}, { timestamps: true });

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
    type: Object,
    required: true
  }
}, { timestamps: true });


const Table = mongoose.model('Table', TableSchema);
const TableRow = mongoose.model('TableRow', TableRowSchema);

module.exports = { Table, TableRow };