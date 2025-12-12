var winston = require('../config/winston');
const { Namespace } = require('../models/kb_setting');

async function up () {

  if (!process.env.PINECONE_INDEX || !process.env.PINECONE_TYPE) {
    winston.error("Namespace engine migration STOPPED. PINECONE_TYPE or PINECONE_INDEX undefined.");
    return;
  }

  let engine = {
    name: "pinecone",
    type: process.env.PINECONE_TYPE,
    apikey: "",
    vector_size: 1536,
    index_name: process.env.PINECONE_INDEX
  };

  try {
    const updates = await Namespace.updateMany(
      { engine: { $exists: false } },
      { engine: engine }
    );
    winston.info("Schema updated for " + updates.nModified + " namespace");
  } catch (err) {
    winston.error("Error updating namespaces in migration:", err);
    throw err;
  }
}

module.exports = { up }; 