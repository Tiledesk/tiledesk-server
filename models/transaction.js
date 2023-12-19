const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema({
  transaction_id: {
    type: String,
    required: true
  },
  id_project: {
    type: String,
    required: true
  },
  template_name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: false
  },
  channel: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
})


const Transaction = mongoose.model("Transactions", TransactionSchema);

module.exports = { Transaction };