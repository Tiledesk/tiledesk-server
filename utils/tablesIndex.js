function sanitizeIndexToken(value) {
  return String(value).replace(/[^a-zA-Z0-9_]/g, '_');
}

function rowColumnIndexName(id_table, columnName) {
  return `tablerow_${sanitizeIndexToken(id_table)}_${sanitizeIndexToken(columnName)}`;
}

function rowColumnIndexSpec(id_project, id_table, columnName) {
  return {
    id_project: 1,
    id_table: 1,
    [`data.${columnName}`]: 1,
  };
}

async function listCollectionIndexes(collection) {
  try {
    return await collection.indexes();
  } catch (err) {
    winston && winston.warn('tablesIndex: could not list indexes', err);
    return [];
  }
}

async function dropRowColumnIndex(collection, id_table, columnName) {
  const indexName = rowColumnIndexName(id_table, columnName);
  const indexes = await listCollectionIndexes(collection);
  const exists = indexes.some(idx => idx.name === indexName);
  if (!exists) {
    return;
  }
  await collection.dropIndex(indexName);
}

async function ensureRowColumnIndex(collection, id_project, id_table, columnName) {
  const indexName = rowColumnIndexName(id_table, columnName);
  const spec = rowColumnIndexSpec(id_project, id_table, columnName);
  await collection.createIndex(spec, { name: indexName, background: true });
}

/**
 * After column rename: drop index on old name, create on new name (only if indexed).
 */
async function reindexColumnOnRename(TableRow, id_project, id_table, oldName, newName, indexed) {
  if (!indexed) {
    return;
  }
  const collection = TableRow.collection;
  await dropRowColumnIndex(collection, id_table, oldName);
  await ensureRowColumnIndex(collection, id_project, id_table, newName);
}

async function dropColumnIndexIfExists(TableRow, id_table, columnName) {
  await dropRowColumnIndex(TableRow.collection, id_table, columnName);
}

module.exports = {
  rowColumnIndexName,
  rowColumnIndexSpec,
  ensureRowColumnIndex,
  dropRowColumnIndex,
  reindexColumnOnRename,
  dropColumnIndexIfExists,
};
