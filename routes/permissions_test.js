const express = require('express');
const router = express.Router();
const permissions = require('../middleware/permission.middleware');
const roleChecker = require('../middleware/has-role');
const validtoken = require('../middleware/valid-token');

router.post('/create',
    validtoken,
    roleChecker.hasRoleOrTypes('agent', ['bot','subscription']), 
    permissions('permission_test_create'), 
    (req, res) => {
        console.log("** CREATE PERMISSION ENDPOINT REACHED");
        res.json({ message: 'Test permission' });
});

router.get('/read', permissions('permission_test_read'), (req, res) => {
    res.json({ message: 'Test permission' });
});

router.get('/read/:id', permissions('permission_test_read'), (req, res) => {
    res.json({ message: 'Test permission' });
});

router.put('/update', permissions('permission_test_update'), (req, res) => {
    res.json({ message: 'Test permission' });
});

router.delete('/delete', permissions('permission_test_delete'), (req, res) => {
    res.json({ message: 'Test permission' });
});

module.exports = router;