const express = require('express');
const router = express.Router();
const winston = require('../config/winston');
const dataTableService = require('../services/dataTableService');

function getRowPayload(body) {
  if (body && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data;
  }
  return body;
}

function isValidationError(err) {
  if (!err || !err.message) return false;
  const msg = err.message;
  return msg.indexOf('does not exist') !== -1 ||
    msg.indexOf('required') !== -1 ||
    msg.indexOf('Invalid') !== -1 ||
    msg.indexOf('must be') !== -1 ||
    msg.indexOf('already exists') !== -1 ||
    msg.indexOf('Column id') !== -1 ||
    msg.indexOf('not provided') !== -1 ||
    msg.indexOf('Operator') !== -1 ||
    msg.indexOf('id_row or conditions') !== -1 ||
    msg.indexOf('data is required') !== -1 ||
    msg.indexOf('valid JSON') !== -1;
}

function handleError(res, err, action) {
  if (isValidationError(err)) {
    const status = err.message.indexOf('already exists') !== -1 ? 409 : 400;
    return res.status(status).send({ success: false, message: err.message });
  }
  if (err.message === 'Column not found' || err.message.indexOf('Column not found:') === 0) {
    return res.status(404).send({ success: false, message: err.message });
  }
  winston.error('DataTable ' + action + ': ', err);
  return res.status(500).send({ success: false, error: 'Error ' + action });
}

// --- Tables ---

router.get('/', async function (req, res) {
  try {
    res.status(200).send(await dataTableService.listTables(req.projectid));
  } catch (err) {
    handleError(res, err, 'finding tables');
  }
});

router.get('/:id', async function (req, res) {
  try {
    const table = await dataTableService.getTable(req.projectid, req.params.id);
    if (!table) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'finding table');
  }
});

router.post('/', async function (req, res) {
  try {
    const table = await dataTableService.createTable(
      req.projectid,
      req.body,
      req.user.id || req.user._id
    );
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'creating table');
  }
});

router.put('/:id', async function (req, res) {
  try {
    const table = await dataTableService.updateTable(req.projectid, req.params.id, req.body);
    if (!table) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'updating table');
  }
});

router.delete('/:id', async function (req, res) {
  try {
    const deleted = await dataTableService.deleteTable(req.projectid, req.params.id);
    if (!deleted) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send({ success: true, message: 'Table deleted successfully' });
  } catch (err) {
    handleError(res, err, 'deleting table');
  }
});

// --- Columns ---

router.post('/:id/columns', async function (req, res) {
  try {
    const table = await dataTableService.addColumn(req.projectid, req.params.id, req.body);
    if (!table) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'adding column');
  }
});

router.patch('/:id/columns/:columnId', async function (req, res) {
  try {
    const table = await dataTableService.renameColumn(
      req.projectid,
      req.params.id,
      req.params.columnId,
      req.body.name
    );
    if (!table) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'renaming column');
  }
});

router.delete('/:id/columns/:columnId', async function (req, res) {
  try {
    const table = await dataTableService.deleteColumn(
      req.projectid,
      req.params.id,
      req.params.columnId
    );
    if (!table) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(table);
  } catch (err) {
    handleError(res, err, 'deleting column');
  }
});

// --- Rows (insert / update / upsert / delete by id_row or conditions) ---

function getRowsListParams(req) {
  var params = Object.assign({}, req.query);
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    if (req.body.must_match !== undefined) params.must_match = req.body.must_match;
    if (req.body.match !== undefined) params.match = req.body.match;
    if (req.body.conditions !== undefined) params.conditions = req.body.conditions;
  }
  return params;
}

router.get('/:id/rows/list', async function (req, res) {

  console.log("List rows")
  try {
    const rows = await dataTableService.listRowsWithFilter(
      req.projectid,
      req.params.id,
      getRowsListParams(req)
    );
    if (rows === null) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(rows);
  } catch (err) {
    handleError(res, err, 'listing rows');
  }
});

router.post('/:id/row/insert', async function (req, res) {
  console.log("Insert row")
  try {
    const row = await dataTableService.insertRowByBody(req.projectid, req.params.id, req.body);
    if (!row) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(row);
  } catch (err) {
    handleError(res, err, 'inserting row');
  }
});

router.put('/:id/row/update', async function (req, res) {
  try {
    const row = await dataTableService.updateRowByBody(req.projectid, req.params.id, req.body);
    if (row === null) return res.status(404).send({ success: false, error: 'Table not found' });
    if (row === undefined) return res.status(404).send({ success: false, error: 'Row not found' });
    res.status(200).send(row);
  } catch (err) {
    handleError(res, err, 'updating row');
  }
});

router.put('/:id/row/upsert', async function (req, res) {
  try {
    const result = await dataTableService.upsertRowByBody(req.projectid, req.params.id, req.body);
    if (result === null) return res.status(404).send({ success: false, error: 'Table not found' });
    res.status(200).send(result);
  } catch (err) {
    if (err.message === 'Multiple rows match the conditions') {
      return res.status(409).send({ success: false, message: err.message });
    }
    handleError(res, err, 'upserting row');
  }
});

router.put('/:id/row/delete', async function (req, res) {
  try {
    const row = await dataTableService.deleteRowByBody(req.projectid, req.params.id, req.body);
    if (row === null) return res.status(404).send({ success: false, error: 'Table not found' });
    if (row === undefined) return res.status(404).send({ success: false, error: 'Row not found' });
    res.status(200).send(row);
  } catch (err) {
    handleError(res, err, 'deleting row');
  }
});

// --- Rows (REST) ---

// router.get('/:id/rows', async function (req, res) {
//   try {
//     const rows = await dataTableService.listRows(req.projectid, req.params.id);
//     if (rows === null) return res.status(404).send({ success: false, error: 'Table not found' });
//     res.status(200).send(rows);
//   } catch (err) {
//     handleError(res, err, 'finding rows');
//   }
// });

// router.get('/:id/rows/:rowId', async function (req, res) {
//   try {
//     const row = await dataTableService.getRow(req.projectid, req.params.id, req.params.rowId);
//     if (!row) return res.status(404).send({ success: false, error: 'Row not found' });
//     res.status(200).send(row);
//   } catch (err) {
//     handleError(res, err, 'finding row');
//   }
// });

// router.post('/:id/rows', async function (req, res) {
//   try {
//     const row = await dataTableService.insertRow(req.projectid, req.params.id, getRowPayload(req.body));
//     if (!row) return res.status(404).send({ success: false, error: 'Table not found' });
//     res.status(200).send(row);
//   } catch (err) {
//     handleError(res, err, 'inserting row');
//   }
// });

// router.put('/:id/rows/:rowId', async function (req, res) {
//   try {
//     const row = await dataTableService.updateRow(
//       req.projectid,
//       req.params.id,
//       req.params.rowId,
//       getRowPayload(req.body)
//     );
//     if (row === null) return res.status(404).send({ success: false, error: 'Table not found' });
//     if (row === undefined) return res.status(404).send({ success: false, error: 'Row not found' });
//     res.status(200).send(row);
//   } catch (err) {
//     handleError(res, err, 'updating row');
//   }
// });

// router.delete('/:id/rows/:rowId', async function (req, res) {
//   try {
//     const row = await dataTableService.deleteRow(req.projectid, req.params.id, req.params.rowId);
//     if (!row) return res.status(404).send({ success: false, error: 'Row not found' });
//     res.status(200).send(row);
//   } catch (err) {
//     handleError(res, err, 'deleting row');
//   }
// });

// router.post('/:id/rows/search', async function (req, res) {
//   try {
//     const rows = await dataTableService.searchRows(req.projectid, req.params.id, req.body);
//     if (rows === null) return res.status(404).send({ success: false, error: 'Table not found' });
//     res.status(200).send(rows);
//   } catch (err) {
//     handleError(res, err, 'searching rows');
//   }
// });

module.exports = router;
