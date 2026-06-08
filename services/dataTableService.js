const { Table, TableRow } = require('../models/dataTable');
const dataTableUtiles = require('../utils/dataTableUtils');
const { calculateBsonSize } = require('../utils/dataTableBsonUtils');
const mongoose = require('mongoose');

const DEFAULT_TABLE_MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB

function getTableMaxSizeBytes() {
  const val = process.env.TABLE_MAX_SIZE_BYTES || DEFAULT_TABLE_MAX_SIZE_BYTES;
  const n = parseInt(val, 10);
  return isNaN(n) || n <= 0 ? DEFAULT_TABLE_MAX_SIZE_BYTES : n;
}

function getTableStats(table) {
  const stats = table.stats || {};
  return {
    rows: stats.rows || 0,
    sizeBytes: stats.sizeBytes || 0,
  };
}

function assertTableSizeLimit(table, delta) {
  if (delta <= 0) return;
  const maxSize = getTableMaxSizeBytes();
  const stats = getTableStats(table);
  if (stats.sizeBytes + delta > maxSize) {
    throw new Error('TABLE_SIZE_LIMIT_EXCEEDED');
  }
}

function rowToPlainObject(row) {
  return row.toObject ? row.toObject({ depopulate: true }) : row;
}

function buildInsertRowDoc(id_project, id_table, data, id_row) {
  const now = new Date();
  return {
    _id: id_row || new mongoose.Types.ObjectId(),
    id_project: id_project,
    id_table: id_table,
    data: data,
    createdAt: now,
    updatedAt: now,
  };
}

function buildUpdatedRowDoc(existingRow, dataPatch) {
  const plain = rowToPlainObject(existingRow);
  plain.data = Object.assign({}, plain.data || {}, dataPatch);
  plain.updatedAt = new Date();
  return plain;
}

function dataPatchFromUpdate(update) {
  const data = {};
  const set = (update && update.$set) || {};
  for (const key in set) {
    if (Object.prototype.hasOwnProperty.call(set, key) && key.indexOf('data.') === 0) {
      data[key.slice(5)] = set[key];
    }
  }
  return data;
}

async function incrementTableStats(id_project, id_table, rowsDelta, sizeDelta) {
  if (rowsDelta === 0 && sizeDelta === 0) return;
  await Table.findOneAndUpdate(
    { id_project: id_project, _id: id_table },
    { $inc: { 'stats.rows': rowsDelta, 'stats.sizeBytes': sizeDelta } }
  );
}

function computeInsertDelta(rowDoc) {
  return calculateBsonSize(rowDoc);
}

function computeUpdateDelta(existingRows, update) {
  const dataPatch = dataPatchFromUpdate(update);
  let totalDelta = 0;
  for (let i = 0; i < existingRows.length; i++) {
    const oldSize = calculateBsonSize(rowToPlainObject(existingRows[i]));
    const newSize = calculateBsonSize(buildUpdatedRowDoc(existingRows[i], dataPatch));
    totalDelta += newSize - oldSize;
  }
  return totalDelta;
}

function computeDeleteDelta(existingRows) {
  let totalSize = 0;
  for (let i = 0; i < existingRows.length; i++) {
    totalSize += calculateBsonSize(rowToPlainObject(existingRows[i]));
  }
  return { rowsDelta: -existingRows.length, sizeDelta: -totalSize };
}

function formatTable(table) {
  const o = table.toObject ? table.toObject() : table;
  return {
    _id: o._id,
    id_project: o.id_project,
    name: o.name,
    schema: o.schema || [],
    stats: getTableStats(o),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function formatRow(row, schema) {
  const o = row.toObject ? row.toObject() : row;
  return {
    _id: o._id,
    id_project: o.id_project,
    id_table: o.id_table,
    data: dataTableUtiles.fillRowDataFromSchema(o.data, schema || []),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function formatRowForList(row, schema) {
  const o = row.toObject ? row.toObject() : row;
  return Object.assign(
    { _id: o._id },
    dataTableUtiles.fillRowDataFromSchema(o.data, schema || [])
  );
}

function hasConditions(body) {
  return !!(body.conditions && body.conditions.length && !body.id_row);
}

class DataTableService {

  async listTables(id_project) {
    const tables = await Table.find({ id_project }).sort({ createdAt: -1 });
    return tables.map(formatTable);
  }

  async getTable(id_project, id_table) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const result = formatTable(table);
    const rows = await TableRow.find({ id_project: id_project, id_table: id_table })
      .sort({ createdAt: 1 })
      .limit(100);
    const schema = table.schema || [];
    result.rows = rows.map(function (row) {
      return dataTableUtiles.fillRowDataFromSchema(row.data, schema);
    });
    return result;
  }

  async createTable(id_project, body, createdBy) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new Error('name is required');
    }
    const schema = dataTableUtiles.normalizeSchemaForCreate(body.schema);
    const table = await Table.create({
      id_project: id_project,
      name: body.name.trim(),
      schema: schema,
      createdBy: createdBy,
    });
    return formatTable(table);
  }

  async updateTable(id_project, id_table, body) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const update = {};
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        throw new Error('name is required');
      }
      update.name = body.name.trim();
    }

    if (body.schema === undefined) {
      if (Object.keys(update).length === 0) {
        throw new Error('name or schema is required');
      }
      const renamedOnly = await Table.findOneAndUpdate(
        { id_project: id_project, _id: id_table },
        update,
        { new: true }
      );
      return formatTable(renamedOnly);
    }

    const currentSchema = table.schema || [];
    const resolved = dataTableUtiles.resolveSchemaUpdate(body.schema, currentSchema);

    for (let d = 0; d < resolved.deletes.length; d++) {
      const delName = resolved.deletes[d];
      await TableRow.updateMany(
        { id_project: id_project, id_table: id_table },
        { $unset: { ['data.' + delName]: '' } }
      );
    }

    for (let r = 0; r < resolved.renames.length; r++) {
      const ren = resolved.renames[r];
      await TableRow.updateMany(
        { id_project: id_project, id_table: id_table },
        { $rename: { ['data.' + ren.oldName]: 'data.' + ren.newName } }
      );
    }

    update.schema = resolved.schema;
    const updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      update,
      { new: true }
    );
    return formatTable(updated);
  }

  async deleteTable(id_project, id_table) {
    const table = await Table.findOneAndDelete({ id_project: id_project, _id: id_table });
    if (!table) return false;
    await TableRow.deleteMany({ id_project: id_project, id_table: id_table });
    return true;
  }

  async addColumn(id_project, id_table, columnInput) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    const newCol = dataTableUtiles.normalizeColumnToAdd(columnInput, schema.length, schema);
    schema.push(newCol);

    const updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      { schema: schema },
      { new: true }
    );
    return formatTable(updated);
  }

  async renameColumn(id_project, id_table, columnId, newName) {
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      throw new Error('name is required');
    }
    const trimmed = newName.trim();

    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    const col = dataTableUtiles.findColumn(schema, columnId);
    if (!col) throw new Error('Column not found');

    if (col.name === trimmed) return formatTable(table);

    if (dataTableUtiles.findColumnByName(schema, trimmed)) {
      throw new Error('Column name already exists: ' + trimmed);
    }

    const oldName = col.name;
    const newSchema = schema.map(function (c) {
      if (c.id === columnId) return { id: c.id, name: trimmed, type: c.type, index: c.index };
      return c;
    });

    await TableRow.updateMany(
      { id_project: id_project, id_table: id_table },
      { $rename: { ['data.' + oldName]: 'data.' + trimmed } }
    );

    const updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      { schema: newSchema },
      { new: true }
    );
    return formatTable(updated);
  }

  async deleteColumn(id_project, id_table, columnId) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    const col = dataTableUtiles.findColumn(schema, columnId);
    if (!col) throw new Error('Column not found');

    const newSchema = schema.filter(function (c) { return c.id !== columnId; });

    await TableRow.updateMany(
      { id_project: id_project, id_table: id_table },
      { $unset: { ['data.' + col.name]: '' } }
    );

    const updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      { schema: newSchema },
      { new: true }
    );
    return formatTable(updated);
  }

  async listRows(id_project, id_table) {
    return this.listRowsWithFilter(id_project, id_table, {});
  }

  async listRowsWithFilter(id_project, id_table, params) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    let conditions = params.conditions;

    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch (e) {
        throw new Error('conditions must be a valid JSON array');
      }
    }

    const baseQuery = { id_project: id_project, id_table: id_table };

    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      const filter = dataTableUtiles.buildSearchFilter({
        must_match: params.must_match,
        match: params.match,
        conditions: conditions,
      }, schema);
      Object.assign(baseQuery, filter);
    }

    const rows = await TableRow.find(baseQuery).sort({ createdAt: 1 });
    return rows.map(function (row) {
      return formatRowForList(row, schema);
    });
  }

  async getRow(id_project, id_table, id_row) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;
    const row = await TableRow.findOne({ id_project: id_project, id_table: id_table, _id: id_row });
    if (!row) return null;
    return formatRow(row, table.schema || []);
  }

  async insertRow(id_project, id_table, rawData) {
    return this.insertRowByBody(id_project, id_table, { data: rawData });
  }

  async insertRowByBody(id_project, id_table, body) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    if (body.data === undefined || body.data === null) {
      throw new Error('data is required');
    }
    const data = dataTableUtiles.validateRowData(body.data, table.schema || []);
    const rowDoc = buildInsertRowDoc(id_project, id_table, data, body.id_row);
    const rowSize = computeInsertDelta(rowDoc);
    assertTableSizeLimit(table, rowSize);

    const row = await TableRow.create({
      _id: rowDoc._id,
      id_project: id_project,
      id_table: id_table,
      data: data,
    });
    await incrementTableStats(id_project, id_table, 1, rowSize);
    return formatRow(row, table.schema || []);
  }

  async updateRow(id_project, id_table, id_row, rawData) {
    return this.updateRowByBody(id_project, id_table, { id_row: id_row, data: rawData });
  }

  async updateRowByBody(id_project, id_table, body) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    const update = dataTableUtiles.buildUpdateSet(body.data, schema);
    const rowFilter = dataTableUtiles.buildRowQueryFilter(body, schema);
    const filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);

    if (hasConditions(body)) {
      const matches = await TableRow.find(filter).sort({ createdAt: 1 });
      if (matches.length === 0) return undefined;
      const sizeDelta = computeUpdateDelta(matches, update);
      assertTableSizeLimit(table, sizeDelta);
      await TableRow.updateMany(filter, update);
      await incrementTableStats(id_project, id_table, 0, sizeDelta);
      const updatedRows = await TableRow.find(filter).sort({ createdAt: 1 });
      return updatedRows.map(function (r) { return formatRow(r, schema); });
    }

    const existing = await TableRow.findOne(filter);
    if (!existing) return undefined;
    const singleDelta = computeUpdateDelta([existing], update);
    assertTableSizeLimit(table, singleDelta);
    const row = await TableRow.findOneAndUpdate(filter, update, { new: true });
    await incrementTableStats(id_project, id_table, 0, singleDelta);
    return formatRow(row, schema);
  }

  async upsertRowByBody(id_project, id_table, body) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      throw new Error('data is required');
    }

    const update = dataTableUtiles.buildUpdateSet(body.data, schema);
    const rowData = dataTableUtiles.validateRowData(body.data, schema);

    if (body.id_row) {
      const filterById = { id_project: id_project, id_table: id_table, _id: body.id_row };
      const existing = await TableRow.findOne(filterById);
      if (existing) {
        const updateDelta = computeUpdateDelta([existing], update);
        assertTableSizeLimit(table, updateDelta);
        const updated = await TableRow.findOneAndUpdate(filterById, update, { new: true });
        await incrementTableStats(id_project, id_table, 0, updateDelta);
        return formatRow(updated, schema);
      }
      const insertDoc = buildInsertRowDoc(id_project, id_table, rowData, body.id_row);
      const insertSize = computeInsertDelta(insertDoc);
      assertTableSizeLimit(table, insertSize);
      try {
        const created = await TableRow.create({
          _id: body.id_row,
          id_project: id_project,
          id_table: id_table,
          data: rowData,
        });
        await incrementTableStats(id_project, id_table, 1, insertSize);
        return formatRow(created, schema);
      } catch (createErr) {
        if (createErr.code === 11000) {
          const racedExisting = await TableRow.findOne(filterById);
          if (racedExisting) {
            const racedDelta = computeUpdateDelta([racedExisting], update);
            assertTableSizeLimit(table, racedDelta);
            const raced = await TableRow.findOneAndUpdate(filterById, update, { new: true });
            await incrementTableStats(id_project, id_table, 0, racedDelta);
            if (raced) return formatRow(raced, schema);
          }
        }
        throw createErr;
      }
    }

    const rowFilter = dataTableUtiles.buildRowQueryFilter(body, schema);
    const filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);
    const matches = await TableRow.find(filter).sort({ createdAt: 1 });

    if (matches.length === 0) {
      const newDoc = buildInsertRowDoc(id_project, id_table, rowData);
      const newSize = computeInsertDelta(newDoc);
      assertTableSizeLimit(table, newSize);
      const inserted = await TableRow.create({ id_project: id_project, id_table: id_table, data: rowData });
      await incrementTableStats(id_project, id_table, 1, newSize);
      return formatRow(inserted, schema);
    }

    if (matches.length > 1) {
      throw new Error('Multiple rows match the conditions');
    }

    const upsertDelta = computeUpdateDelta(matches, update);
    assertTableSizeLimit(table, upsertDelta);
    const updated = await TableRow.findOneAndUpdate(filter, update, { new: true });
    await incrementTableStats(id_project, id_table, 0, upsertDelta);
    return formatRow(updated, schema);
  }

  async deleteRow(id_project, id_table, id_row) {
    return this.deleteRowByBody(id_project, id_table, { id_row: id_row });
  }

  async deleteRowByBody(id_project, id_table, body) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const rowFilter = dataTableUtiles.buildRowQueryFilter(body, table.schema || []);
    const filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);

    const schema = table.schema || [];

    if (hasConditions(body)) {
      const rows = await TableRow.find(filter).sort({ createdAt: 1 });
      if (rows.length === 0) return undefined;
      const formatted = rows.map(function (r) { return formatRow(r, schema); });
      const deleteDelta = computeDeleteDelta(rows);
      await TableRow.deleteMany(filter);
      await incrementTableStats(id_project, id_table, deleteDelta.rowsDelta, deleteDelta.sizeDelta);
      return formatted;
    }

    const row = await TableRow.findOne(filter);
    if (!row) return undefined;
    const singleDeleteDelta = computeDeleteDelta([row]);
    const deleted = await TableRow.findOneAndDelete(filter);
    await incrementTableStats(id_project, id_table, singleDeleteDelta.rowsDelta, singleDeleteDelta.sizeDelta);
    return formatRow(deleted, schema);
  }

  async searchRows(id_project, id_table, searchBody) {
    const table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    const schema = table.schema || [];
    const filter = dataTableUtiles.buildSearchFilter(searchBody, schema);
    const query = { id_project: id_project, id_table: id_table };
    Object.assign(query, filter);
    const rows = await TableRow.find(query);
    return rows.map(function (r) { return formatRow(r, schema); });
  }
}

module.exports = new DataTableService();
