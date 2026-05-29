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

function getAllowedColumns(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return [];
  }
  return Object.keys(schema);
}

function assertColumnAllowed(column, allowedColumns) {
  if (!isSafeColumnName(column)) {
    throw new Error(`Invalid column: ${column}`);
  }
  if (!allowedColumns.includes(column)) {
    throw new Error(`Column not allowed: ${column}`);
  }
}

function validateUpdateColumns(data, allowedColumns) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('data must be a non-empty object');
  }
  const keys = Object.keys(data);
  if (keys.length === 0) {
    throw new Error('data must contain at least one field to update');
  }
  for (const column of keys) {
    assertColumnAllowed(column, allowedColumns);
  }
}

function buildSingleCondition(column, condition, value) {
  const field = `data.${column}`;
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

function parseConditions(conditions, allowedColumns) {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw new Error('conditions must be a non-empty array');
  }

  return conditions.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid condition at index ${index}`);
    }

    const { column, condition, value } = item;

    if (typeof column !== 'string' || typeof condition !== 'string') {
      throw new Error(`Invalid condition at index ${index}`);
    }

    if (value === undefined) {
      throw new Error(`Missing value for condition at index ${index}`);
    }

    assertColumnAllowed(column, allowedColumns);

    if (!SUPPORTED_CONDITIONS.includes(condition)) {
      throw new Error(`Unsupported condition: ${condition}`);
    }

    return buildSingleCondition(column, condition, value);
  });
}

function buildConditionsQuery(conditions, mustMatch, allowedColumns) {
  const matchMode = mustMatch || 'all';
  if (matchMode !== 'all' && matchMode !== 'any') {
    throw new Error('must_match must be "all" or "any"');
  }

  const clauses = parseConditions(conditions, allowedColumns);
  const logicalOperator = matchMode === 'any' ? '$or' : '$and';

  return { [logicalOperator]: clauses };
}

function buildUpdateSet(data, allowedColumns) {
  validateUpdateColumns(data, allowedColumns);

  const $set = {};
  for (const [column, value] of Object.entries(data)) {
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
  assertColumnAllowed,
  validateUpdateColumns,
  buildSingleCondition,
  parseConditions,
  buildConditionsQuery,
  buildUpdateSet,
  escapeRegex,
};
