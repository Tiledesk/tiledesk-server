const crypto = require('crypto');

const COLUMN_ID_PREFIX = 'col_';

function generateColumnId() {
  return COLUMN_ID_PREFIX + crypto.randomBytes(8).toString('hex');
}

/** Immutable key used in row `data.*` paths (unchanged on column rename). */
function getColumnStorageKey(col) {
  return col.key || col.name;
}

function withStorageKeys(schema) {
  return schema.map(col => ({
    ...col,
    key: getColumnStorageKey(col),
  }));
}

function isColumnDefinitionArray(schema) {
  return Array.isArray(schema) && schema.length > 0
    && schema.every(c => c && typeof c === 'object' && typeof c.name === 'string' && c.name.length > 0);
}

function isSchemaMetadataArray(schema) {
  return isColumnDefinitionArray(schema)
    && schema.every(c => typeof c.id === 'string' && c.id.length > 0);
}

function isLegacySchemaMap(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return false;
  }
  const values = Object.values(schema);
  if (values.length === 0) {
    return true;
  }
  return values.every(v => typeof v === 'string');
}

/**
 * Build schema[] from legacy map { email: 'string', ... }.
 */
function schemaFromLegacyMap(legacyMap) {
  if (!legacyMap || typeof legacyMap !== 'object' || Array.isArray(legacyMap)) {
    return [];
  }
  return Object.entries(legacyMap).map(([name, type], index) => ({
    id: generateColumnId(),
    name,
    key: name,
    type: typeof type === 'string' ? type : 'string',
    index,
    indexed: false,
  }));
}

/**
 * Normalize table document to schema[] (does not persist).
 */
function getTableSchema(table) {
  if (!table) {
    return [];
  }
  if (isSchemaMetadataArray(table.schema)) {
    return withStorageKeys(table.schema).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }
  if (isSchemaMetadataArray(table.columns)) {
    return withStorageKeys(table.columns).sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  }
  if (isLegacySchemaMap(table.schema)) {
    return schemaFromLegacyMap(table.schema);
  }
  return [];
}

/** @deprecated use getTableSchema */
const getTableColumns = getTableSchema;

function findColumnById(schema, columnId) {
  return schema.find(c => c.id === columnId);
}

function findColumnByNameOrKey(schema, nameOrKey) {
  return schema.find(c => c.name === nameOrKey || getColumnStorageKey(c) === nameOrKey);
}

/**
 * columnId -> storage key in row data (throws if unknown).
 */
function resolveColumnId(schema, columnId) {
  if (typeof columnId !== 'string' || columnId.length === 0) {
    throw new Error('columnId is required');
  }
  const col = findColumnById(schema, columnId);
  if (!col) {
    throw new Error(`Unknown columnId: ${columnId}`);
  }
  return getColumnStorageKey(col);
}

const FORBIDDEN_COLUMN_NAMES = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '$where',
]);

function assertSafeColumnName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Invalid column: ${name}`);
  }
  if (FORBIDDEN_COLUMN_NAMES.has(name) || name.startsWith('$') || name.includes('.')) {
    throw new Error(`Invalid column: ${name}`);
  }
}

/**
 * Resolve condition/update reference: columnId (preferred) or column name (deprecated).
 */
function resolveColumnRef(schema, { columnId, column }, logDeprecation) {
  if (columnId) {
    return resolveColumnId(schema, columnId);
  }
  if (column) {
    assertSafeColumnName(column);
    const col = findColumnByNameOrKey(schema, column);
    if (!col) {
      throw new Error(`Column not allowed: ${column}`);
    }
    if (typeof logDeprecation === 'function') {
      logDeprecation(`Deprecated: use columnId "${col.id}" instead of column name "${column}"`);
    }
    return getColumnStorageKey(col);
  }
  throw new Error('columnId or column is required');
}

function getAllowedColumnNames(schema) {
  return schema.map(getColumnStorageKey);
}

function getColumnIdToNameMap(schema) {
  const map = {};
  for (const col of schema) {
    map[col.id] = getColumnStorageKey(col);
  }
  return map;
}

/**
 * Resolve data object keys: columnId keys -> storage keys for Mongo paths.
 */
function resolveDataKeys(data, schema, logDeprecation) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('data must be a non-empty object');
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error('data must contain at least one field to update');
  }

  const resolved = {};
  for (const key of keys) {
    const byId = findColumnById(schema, key);
    if (byId) {
      resolved[getColumnStorageKey(byId)] = data[key];
      continue;
    }
    assertSafeColumnName(key);
    const byName = findColumnByNameOrKey(schema, key);
    if (byName) {
      if (typeof logDeprecation === 'function') {
        logDeprecation(`Deprecated: use columnId "${byName.id}" instead of column name "${key}" in data`);
      }
      resolved[getColumnStorageKey(byName)] = data[key];
      continue;
    }
    throw new Error(`Column not allowed: ${key}`);
  }
  return resolved;
}

/**
 * Persist schema[] on table when legacy map or old `columns` field is stored.
 */
async function ensureTableSchemaPersisted(table, TableModel) {
  let schema = getTableSchema(table);
  const needsKeyMigration = isSchemaMetadataArray(table.schema)
    && table.schema.some(c => !c.key);

  if (isSchemaMetadataArray(table.schema) && !table.columns && !needsKeyMigration) {
    return table;
  }

  if (schema.length === 0) {
    return table;
  }

  const updated = await TableModel.findOneAndUpdate(
    { _id: table._id, id_project: table.id_project },
    { schema, $unset: { columns: 1 } },
    { new: true }
  );
  return updated || table;
}

/** @deprecated use ensureTableSchemaPersisted */
const ensureTableColumnsPersisted = ensureTableSchemaPersisted;

/** @deprecated use findColumnByNameOrKey */
const findColumnByName = findColumnByNameOrKey;

/** @deprecated use schemaFromLegacyMap */
const columnsFromLegacySchema = schemaFromLegacyMap;

module.exports = {
  COLUMN_ID_PREFIX,
  generateColumnId,
  getColumnStorageKey,
  isColumnDefinitionArray,
  isSchemaMetadataArray,
  isLegacySchemaMap,
  schemaFromLegacyMap,
  columnsFromLegacySchema,
  getTableSchema,
  getTableColumns,
  findColumnById,
  findColumnByName,
  findColumnByNameOrKey,
  resolveColumnId,
  resolveColumnRef,
  getAllowedColumnNames,
  getColumnIdToNameMap,
  resolveDataKeys,
  ensureTableSchemaPersisted,
  ensureTableColumnsPersisted,
};
