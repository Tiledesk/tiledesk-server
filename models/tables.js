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
  /** Column metadata: [{ id, name, type, index, indexed? }] or legacy map on read */
  schema: {
    type: Schema.Types.Mixed,
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

TableRowSchema.index({ id_project: 1, id_table: 1 });

const Table = mongoose.model('Table', TableSchema);
const TableRow = mongoose.model('TableRow', TableRowSchema);

module.exports = { Table, TableRow };
