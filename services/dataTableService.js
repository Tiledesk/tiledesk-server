var { Table, TableRow } = require('../models/dataTable');
var dataTableUtiles = require('../utils/dataTableUtils');
function formatTable(table) {
  var o = table.toObject ? table.toObject() : table;
  return {
    _id: o._id,
    id_project: o.id_project,
    name: o.name,
    schema: o.schema || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

function formatRow(row, schema) {
  var o = row.toObject ? row.toObject() : row;
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
  var o = row.toObject ? row.toObject() : row;
  return Object.assign(
    { _id: o._id },
    dataTableUtiles.fillRowDataFromSchema(o.data, schema || [])
  );
}

class DataTableService {

  async listTables(id_project) {
    var tables = await Table.find({ id_project }).sort({ createdAt: -1 });
    return tables.map(formatTable);
  }

  async getTable(id_project, id_table) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var result = formatTable(table);
    var rows = await TableRow.find({ id_project: id_project, id_table: id_table })
      .sort({ createdAt: 1 })
      .limit(100);
    var schema = table.schema || [];
    result.rows = rows.map(function (row) {
      return dataTableUtiles.fillRowDataFromSchema(row.data, schema);
    });
    return result;
  }

  async createTable(id_project, body, createdBy) {
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      throw new Error('name is required');
    }
    var schema = dataTableUtiles.normalizeSchemaForCreate(body.schema);
    var table = await Table.create({
      id_project: id_project,
      name: body.name.trim(),
      schema: schema,
      createdBy: createdBy,
    });
    return formatTable(table);
  }

  async updateTable(id_project, id_table, body) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var update = {};
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
      var renamedOnly = await Table.findOneAndUpdate(
        { id_project: id_project, _id: id_table },
        update,
        { new: true }
      );
      return formatTable(renamedOnly);
    }

    var currentSchema = table.schema || [];
    var resolved = dataTableUtiles.resolveSchemaUpdate(body.schema, currentSchema);

    for (var d = 0; d < resolved.deletes.length; d++) {
      var delName = resolved.deletes[d];
      await TableRow.updateMany(
        { id_project: id_project, id_table: id_table },
        { $unset: { ['data.' + delName]: '' } }
      );
    }

    for (var r = 0; r < resolved.renames.length; r++) {
      var ren = resolved.renames[r];
      await TableRow.updateMany(
        { id_project: id_project, id_table: id_table },
        { $rename: { ['data.' + ren.oldName]: 'data.' + ren.newName } }
      );
    }

    update.schema = resolved.schema;
    var updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      update,
      { new: true }
    );
    return formatTable(updated);
  }

  async deleteTable(id_project, id_table) {
    var table = await Table.findOneAndDelete({ id_project: id_project, _id: id_table });
    if (!table) return false;
    await TableRow.deleteMany({ id_project: id_project, id_table: id_table });
    return true;
  }

  async addColumn(id_project, id_table, columnInput) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var newCol = dataTableUtiles.normalizeColumnToAdd(columnInput, schema.length, schema);
    schema.push(newCol);

    var updated = await Table.findOneAndUpdate(
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
    var trimmed = newName.trim();

    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var col = dataTableUtiles.findColumn(schema, columnId);
    if (!col) throw new Error('Column not found');

    if (col.name === trimmed) return formatTable(table);

    if (dataTableUtiles.findColumnByName(schema, trimmed)) {
      throw new Error('Column name already exists: ' + trimmed);
    }

    var oldName = col.name;
    var newSchema = schema.map(function (c) {
      if (c.id === columnId) return { id: c.id, name: trimmed, type: c.type, index: c.index };
      return c;
    });

    await TableRow.updateMany(
      { id_project: id_project, id_table: id_table },
      { $rename: { ['data.' + oldName]: 'data.' + trimmed } }
    );

    var updated = await Table.findOneAndUpdate(
      { id_project: id_project, _id: id_table },
      { schema: newSchema },
      { new: true }
    );
    return formatTable(updated);
  }

  async deleteColumn(id_project, id_table, columnId) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var col = dataTableUtiles.findColumn(schema, columnId);
    if (!col) throw new Error('Column not found');

    var newSchema = schema.filter(function (c) { return c.id !== columnId; });

    await TableRow.updateMany(
      { id_project: id_project, id_table: id_table },
      { $unset: { ['data.' + col.name]: '' } }
    );

    var updated = await Table.findOneAndUpdate(
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
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var conditions = params.conditions;

    if (typeof conditions === 'string') {
      try {
        conditions = JSON.parse(conditions);
      } catch (e) {
        throw new Error('conditions must be a valid JSON array');
      }
    }

    var baseQuery = { id_project: id_project, id_table: id_table };

    if (conditions && Array.isArray(conditions) && conditions.length > 0) {
      var filter = dataTableUtiles.buildSearchFilter({
        must_match: params.must_match,
        match: params.match,
        conditions: conditions,
      }, schema);
      Object.assign(baseQuery, filter);
    }

    var rows = await TableRow.find(baseQuery).sort({ createdAt: 1 });
    return rows.map(function (row) {
      return formatRowForList(row, schema);
    });
  }

  async getRow(id_project, id_table, id_row) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;
    var row = await TableRow.findOne({ id_project: id_project, id_table: id_table, _id: id_row });
    if (!row) return null;
    return formatRow(row, table.schema || []);
  }

  async insertRow(id_project, id_table, rawData) {
    return this.insertRowByBody(id_project, id_table, { data: rawData });
  }

  async insertRowByBody(id_project, id_table, body) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    if (body.data === undefined || body.data === null) {
      throw new Error('data is required');
    }
    var data = dataTableUtiles.validateRowData(body.data, table.schema || []);
    var doc = { id_project: id_project, id_table: id_table, data: data };
    if (body.id_row) {
      doc._id = body.id_row;
    }
    var row = await TableRow.create(doc);
    return formatRow(row, table.schema || []);
  }

  async updateRow(id_project, id_table, id_row, rawData) {
    return this.updateRowByBody(id_project, id_table, { id_row: id_row, data: rawData });
  }

  async updateRowByBody(id_project, id_table, body) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var update = dataTableUtiles.buildUpdateSet(body.data, schema);
    var rowFilter = dataTableUtiles.buildRowQueryFilter(body, schema);
    var filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);

    var row = await TableRow.findOneAndUpdate(filter, update, { new: true });
    if (!row) return undefined;
    return formatRow(row, schema);
  }

  async upsertRowByBody(id_project, id_table, body) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      throw new Error('data is required');
    }

    var update = dataTableUtiles.buildUpdateSet(body.data, schema);
    var rowData = dataTableUtiles.validateRowData(body.data, schema);

    if (body.id_row) {
      var filterById = { id_project: id_project, id_table: id_table, _id: body.id_row };
      var existing = await TableRow.findOne(filterById);
      if (existing) {
        var updated = await TableRow.findOneAndUpdate(filterById, update, { new: true });
        return formatRow(updated, schema);
      }
      try {
        var created = await TableRow.create({
          _id: body.id_row,
          id_project: id_project,
          id_table: id_table,
          data: rowData,
        });
        return formatRow(created, schema);
      } catch (createErr) {
        if (createErr.code === 11000) {
          var raced = await TableRow.findOneAndUpdate(filterById, update, { new: true });
          if (raced) return formatRow(raced, schema);
        }
        throw createErr;
      }
    }

    var rowFilter = dataTableUtiles.buildRowQueryFilter(body, schema);
    var filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);
    var matches = await TableRow.find(filter);

    if (body.multi === true) {
      if (matches.length === 0) {
        var inserted = await TableRow.create({ id_project: id_project, id_table: id_table, data: rowData });
        return [formatRow(inserted, schema)];
      }
      await TableRow.updateMany(filter, update);
      var updatedRows = await TableRow.find(filter).sort({ createdAt: 1 });
      return updatedRows.map(function (r) { return formatRow(r, schema); });
    }

    if (matches.length > 1) {
      throw new Error('Multiple rows match the conditions');
    }
    if (matches.length === 1) {
      var one = await TableRow.findOneAndUpdate(filter, update, { new: true });
      return formatRow(one, schema);
    }

    var newRow = await TableRow.create({ id_project: id_project, id_table: id_table, data: rowData });
    return formatRow(newRow, schema);
  }

  async deleteRow(id_project, id_table, id_row) {
    return this.deleteRowByBody(id_project, id_table, { id_row: id_row });
  }

  async deleteRowByBody(id_project, id_table, body) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var rowFilter = dataTableUtiles.buildRowQueryFilter(body, table.schema || []);
    var filter = { id_project: id_project, id_table: id_table };
    Object.assign(filter, rowFilter);

    var schema = table.schema || [];
    var row = await TableRow.findOneAndDelete(filter);
    if (!row) return undefined;
    return formatRow(row, schema);
  }

  async searchRows(id_project, id_table, searchBody) {
    var table = await Table.findOne({ id_project: id_project, _id: id_table });
    if (!table) return null;

    var schema = table.schema || [];
    var filter = dataTableUtiles.buildSearchFilter(searchBody, schema);
    var query = { id_project: id_project, id_table: id_table };
    Object.assign(query, filter);
    var rows = await TableRow.find(query);
    return rows.map(function (r) { return formatRow(r, schema); });
  }
}

module.exports = new DataTableService();
