const express = require('express');
const router = express.Router();
const { Table, TableRow } = require('../models/tables');
const {
  getAllowedColumns,
  buildConditionsQuery,
  buildUpdateSet,
} = require('../utils/tablesUtil');


// ######## TABLES ENDPOINTS ########

/**
 * Get all tables for a project
 */
router.get('/', async (req, res) => {
  const id_project = req.projectid;

  try {
    const tables = await Table.find({ id_project });
    return res.status(200).send(tables);
  } catch (error) {
    winston.error('Error finding tables: ', error);
    return res.status(500).send({ success: false, error: 'Error finding tables' });
  }
});

/**
 * Get a table by id
 */
router.get('/:id', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;

  try {
    const table = await Table.findOne({ id_project, _id: id_table });
    if (!table) {
      return res.status(404).send({ success: false, error: 'Table not found' });
    }

    const tableRows = await TableRow.find({ id_project, id_table });
    const tableObj = table.toObject();
    tableObj.rows = tableRows.map(row => row.data);

    return res.status(200).send(tableObj);
  }
  catch (error) {
    winston.error('Error finding table: ', error);
    return res.status(500).send({ success: false, error: 'Error finding table' });
  }
});

/**
 * Create a new table
 */
router.post('/', async (req, res) => {
  const id_project = req.projectid;
  const { name, schema } = req.body;

  let table = new Table({ id_project, name, schema, createdBy: req.user.id });

  try {
    const savedTable = await table.save();
    return res.status(200).send(savedTable);
  }
  catch (error) {
    winston.error('Error creating table: ', error);
    return res.status(500).send({ success: false, error: 'Error creating table' });
  }
});

/**
 * Update a table
 */
router.put('/:id', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;
  const { name, schema } = req.body;

  try {
    const table = await Table.findOneAndUpdate({ id_project, _id: id_table }, { name, schema }, { new: true });
    if (!table) {
      return res.status(404).send({ success: false, error: 'Table not found with id: ' + id_table });
    }
    return res.status(200).send(table);
  }
  catch (error) {
    winston.error('Error updating table: ', error);
    return res.status(500).send({ success: false, error: 'Error updating table' });
  }
});

/**
 * Delete a table
 */
router.delete('/:id/delete', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;

  try {
    const table = await Table.findOneAndDelete({ id_project, id_table });
    if (!table) {
      return res.status(404).send({ success: false, error: 'Table not found' });
    }
    return res.status(200).send({ success: true, message: 'Table deleted successfully' });
  }
  catch (error) {
    winston.error('Error deleting table: ', error);
    return res.status(500).send({ success: false, error: 'Error deleting table' });
  }
});


// ######## ROWS ENDPOINTS ########

/**
 * Get all rows for a table
 */
router.get('/:id/rows', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;

  try {
    const rows = await TableRow.find({ id_project, id_table });
    const rowObj = rows.map(row => row.data);
    return res.status(200).send(rowObj);
  }
  catch (error) {
    winston.error('Error finding rows: ', error);
    return res.status(500).send({ success: false, error: 'Error finding rows' });
  }
});

/**
 * Get a row by id
 */
router.get('/:id/row', async (req, res) => {
    return res.status(200).send({ success: true, message: 'Row not found' });
})
  
/**
 * Insert a new row into a table
 */
router.put('/:id/insert', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;
  const { data } = req.body;

  try {
    const table = await TableRow.create({ id_project, id_table, data });
    return res.status(200).send(table);
  }
  catch (error) {
    winston.error('Error inserting row: ', error);
    return res.status(500).send({ success: false, error: 'Error inserting row' });
  }
});

/**
 * Update a row in a table
 */
router.put('/:id/update', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;
  const { id_row, must_match, conditions } = req.body;
  const data = req.body.data;

  try {
    const table = await Table.findOne({ id_project, _id: id_table });
    if (!table) {
      return res.status(404).send({ success: false, error: 'Table not found' });
    }

    const allowedColumns = getAllowedColumns(table.schema);
    let update;

    try {
      update = buildUpdateSet(data, allowedColumns);
    } catch (validationError) {
      return res.status(400).send({ success: false, error: validationError.message });
    }

    if (id_row) {
      const row = await TableRow.findOneAndUpdate(
        { id_project, id_table, _id: id_row },
        update,
        { new: true }
      );
      if (!row) {
        return res.status(404).send({ success: false, error: 'Row not found' });
      }
      return res.status(200).send(row);
    }

    if (!conditions) {
      return res.status(400).send({ success: false, error: 'id_row or conditions is required' });
    }

    let conditionsQuery;
    try {
      conditionsQuery = buildConditionsQuery(conditions, must_match, allowedColumns);
    } catch (validationError) {
      return res.status(400).send({ success: false, error: validationError.message });
    }

    const filter = { id_project, id_table, ...conditionsQuery };
    const row = await TableRow.findOneAndUpdate(filter, update, { new: true });
    if (!row) {
      return res.status(404).send({ success: false, error: 'Row not found' });
    }
    return res.status(200).send(row);
  } catch (error) {
    winston.error('Error updating row: ', error);
    return res.status(500).send({ success: false, error: 'Error updating row' });
  }
});

/**
 * Upsert a row in a table
 */
router.put('/:id/upsert', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;
  const { id_row, must_match, conditions, multi } = req.body;
  const data = req.body.data;

  try {
    const table = await Table.findOne({ id_project, _id: id_table });
    if (!table) {
      return res.status(404).send({ success: false, error: 'Table not found' });
    }

    const allowedColumns = getAllowedColumns(table.schema);
    let update;

    try {
      update = buildUpdateSet(data, allowedColumns);
    } catch (validationError) {
      return res.status(400).send({ success: false, error: validationError.message });
    }

    if (id_row) {
      const filter = { id_project, id_table, _id: id_row };
      const existing = await TableRow.findOne(filter);

      if (existing) {
        const row = await TableRow.findOneAndUpdate(filter, update, { new: true });
        return res.status(200).send(row);
      }

      try {
        const row = await TableRow.create({ _id: id_row, id_project, id_table, data });
        return res.status(200).send(row);
      } catch (createError) {
        if (createError.code === 11000) {
          const row = await TableRow.findOneAndUpdate(filter, update, { new: true });
          if (row) {
            return res.status(200).send(row);
          }
        }
        throw createError;
      }
    }

    if (!conditions) {
      return res.status(400).send({ success: false, error: 'id_row or conditions is required' });
    }

    let conditionsQuery;
    try {
      conditionsQuery = buildConditionsQuery(conditions, must_match, allowedColumns);
    } catch (validationError) {
      return res.status(400).send({ success: false, error: validationError.message });
    }

    const filter = { id_project, id_table, ...conditionsQuery };
    const matches = await TableRow.find(filter);

    if (multi === true) {
      if (matches.length === 0) {
        const row = await TableRow.create({ id_project, id_table, data });
        return res.status(200).send([row]);
      }

      await TableRow.updateMany(filter, update);
      const rows = await TableRow.find(filter);
      return res.status(200).send(rows);
    }

    if (matches.length > 1) {
      return res.status(409).send({ success: false, error: 'Multiple rows match the conditions' });
    }

    if (matches.length === 1) {
      const row = await TableRow.findOneAndUpdate(filter, update, { new: true });
      return res.status(200).send(row);
    }

    const row = await TableRow.create({ id_project, id_table, data });
    return res.status(200).send(row);
  } catch (error) {
    winston.error('Error upserting row: ', error);
    return res.status(500).send({ success: false, error: 'Error upserting row' });
  }
});

/**
 * Delete a row from a table
 */
router.put('/:id/delete', async (req, res) => {
  const id_project = req.projectid;
  const id_table = req.params.id;
  const { data } = req.body;

  try {
    const table = await TableRow.findOneAndDelete({ id_project, id_table, data });
    return res.status(200).send(table);
  }
  catch (error) {
    winston.error('Error deleting row: ', error);
    return res.status(500).send({ success: false, error: 'Error deleting row' });
  }
});




module.exports = router;
