const {
  getAllowedColumnNames,
  getTableSchema,
  getTableColumns,
  resolveColumnId,
  resolveColumnRef,
  resolveDataKeys,
  getColumnIdToNameMap,
} = require('./tablesColumnResolver');

const FORBIDDEN_COLUMN_NAMES = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '$where',
]);

const CONDITION_OPERATORS = {
  'Equal': '$eq',
  'Not equal': '$ne',
  'Greater than': '$gt',
  'Greater or equal': '$gte',
  'Less than': '$lt',
  'Less or equal': '$lte',
  'Contains': '$regex',
};

const SUPPORTED_CONDITIONS = Object.keys(CONDITION_OPERATORS);

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSafeColumnName(column) {
  if (typeof column !== 'string' || column.length === 0) {
    return false;
  }
  if (FORBIDDEN_COLUMN_NAMES.has(column)) {
    return false;
  }
  if (column.startsWith('$') || column.includes('.')) {
    return false;
  }
  return true;
}

/** @deprecated use getAllowedColumnNames(columns) */
function getAllowedColumns(schemaOrColumns) {
  if (Array.isArray(schemaOrColumns)) {
    return getAllowedColumnNames(schemaOrColumns);
  }
  if (!schemaOrColumns || typeof schemaOrColumns !== 'object' || Array.isArray(schemaOrColumns)) {
    return [];
  }
  return Object.keys(schemaOrColumns);
}

function assertColumnAllowed(column, allowedColumns) {
  if (!isSafeColumnName(column)) {
    throw new Error(`Invalid column: ${column}`);
  }
  if (!allowedColumns.includes(column)) {
    throw new Error(`Column not allowed: ${column}`);
  }
}

function buildSingleCondition(columnName, condition, value) {
  const field = `data.${columnName}`;
  const operator = CONDITION_OPERATORS[condition];

  if (!operator) {
    throw new Error(`Unsupported condition: ${condition}`);
  }

  if (condition === 'Equal') {
    return { [field]: value };
  }

  if (condition === 'Contains') {
    return { [field]: { $regex: escapeRegex(value) } };
  }

  return { [field]: { [operator]: value } };
}

function parseConditions(conditions, columns, logDeprecation) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw new Error('conditions must be a non-empty array');
  }

  const allowedNames = getAllowedColumnNames(columns);

  return conditions.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid condition at index ${index}`);
    }

    const { condition, value, columnId, column } = item;

    if (typeof condition !== 'string') {
      throw new Error(`Invalid condition at index ${index}`);
    }

    if (value === undefined) {
      throw new Error(`Missing value for condition at index ${index}`);
    }

    let columnName;
    try {
      columnName = resolveColumnRef(columns, { columnId, column }, logDeprecation);
    } catch (err) {
      throw new Error(err.message);
    }

    assertColumnAllowed(columnName, allowedNames);

    if (!SUPPORTED_CONDITIONS.includes(condition)) {
      throw new Error(`Unsupported condition: ${condition}`);
    }

    return buildSingleCondition(columnName, condition, value);
  });
}

function buildConditionsQuery(conditions, mustMatch, columns, logDeprecation) {
  const matchMode = mustMatch || 'all';
  if (matchMode !== 'all' && matchMode !== 'any') {
    throw new Error('must_match must be "all" or "any"');
  }

  const clauses = parseConditions(conditions, columns, logDeprecation);
  const logicalOperator = matchMode === 'any' ? '$or' : '$and';

  return { [logicalOperator]: clauses };
}

function buildUpdateSet(data, columns, logDeprecation) {
  const resolvedData = resolveDataKeys(data, columns, logDeprecation);
  const allowedNames = getAllowedColumnNames(columns);

  for (const column of Object.keys(resolvedData)) {
    assertColumnAllowed(column, allowedNames);
  }

  const $set = {};
  for (const [column, value] of Object.entries(resolvedData)) {
    $set[`data.${column}`] = value;
  }

  return { $set };
}

module.exports = {
  FORBIDDEN_COLUMN_NAMES,
  CONDITION_OPERATORS,
  SUPPORTED_CONDITIONS,
  isSafeColumnName,
  getAllowedColumns,
  getTableSchema,
  getTableColumns,
  resolveColumnId,
  resolveColumnRef,
  resolveDataKeys,
  getColumnIdToNameMap,
  assertColumnAllowed,
  buildSingleCondition,
  parseConditions,
  buildConditionsQuery,
  buildUpdateSet,
  escapeRegex,
};
