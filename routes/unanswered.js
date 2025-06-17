const express = require('express');
const router = express.Router();
const { Namespace, UnansweredQuestion } = require('../models/kb_setting');
var winston = require('../config/winston');

// Add a new unanswered question
router.post('/', async (req, res) => {
    try {
        const { namespace, question } = req.body;
        const id_project = req.projectid;

        if (!namespace || !question) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameters: namespace and question"
            });
        }

        // Check if namespace belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            });
        }

        const unansweredQuestion = new UnansweredQuestion({
            id_project,
            namespace,
            question
        });

        const savedQuestion = await unansweredQuestion.save();
        res.status(200).json(savedQuestion);

    } catch (error) {
        winston.error('Error adding unanswered question:', error);
        res.status(500).json({
            success: false,
            error: "Error adding unanswered question"
        });
    }
});

// Get all unanswered questions for a namespace
router.get('/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        const id_project = req.projectid;

        if (!namespace) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: namespace"
            });
        }

        // Check if namespace belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            });
        }

        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const sortField = req.query.sortField || 'created_at';
        const direction = parseInt(req.query.direction) || -1;

        const questions = await UnansweredQuestion.find({
            id_project,
            namespace
        })
        .sort({ [sortField]: direction })
        .skip(page * limit)
        .limit(limit);

        const count = await UnansweredQuestion.countDocuments({
            id_project,
            namespace
        });

        res.status(200).json({
            count,
            questions,
            query: {
                page,
                limit,
                sortField,
                direction
            }
        });

    } catch (error) {
        winston.error('Error getting unanswered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error getting unanswered questions"
        });
    }
});

// Delete a specific unanswered question
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const id_project = req.projectid;

        const question = await UnansweredQuestion.findOne({ _id: id, id_project });
        if (!question) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        await UnansweredQuestion.deleteOne({ _id: id });
        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });

    } catch (error) {
        winston.error('Error deleting unanswered question:', error);
        res.status(500).json({
            success: false,
            error: "Error deleting unanswered question"
        });
    }
});

// Delete all unanswered questions for a namespace
router.delete('/namespace/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        const id_project = req.projectid;

        // Check if namespace belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            });
        }

        const result = await UnansweredQuestion.deleteMany({ id_project, namespace });
        res.status(200).json({
            success: true,
            count: result.deletedCount,
            message: "All questions deleted successfully"
        });

    } catch (error) {
        winston.error('Error deleting unanswered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error deleting unanswered questions"
        });
    }
});

// Update an unanswered question
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { question } = req.body;
        const id_project = req.projectid;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: question"
            });
        }

        const updatedQuestion = await UnansweredQuestion.findOneAndUpdate(
            { _id: id, id_project },
            { question },
            { new: true }
        );

        if (!updatedQuestion) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        res.status(200).json(updatedQuestion);

    } catch (error) {
        winston.error('Error updating unanswered question:', error);
        res.status(500).json({
            success: false,
            error: "Error updating unanswered question"
        });
    }
});

// Count unanswered questions for a namespace
router.get('/count/:namespace', async (req, res) => {
    try {
        const { namespace } = req.params;
        const id_project = req.projectid;

        if (!namespace) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: namespace"
            });
        }

        // Check if namespace belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            });
        }

        const count = await UnansweredQuestion.countDocuments({
            id_project,
            namespace
        });

        res.status(200).json({ count });

    } catch (error) {
        winston.error('Error counting unanswered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error counting unanswered questions"
        });
    }
});

// Helper function to validate namespace
async function validateNamespace(id_project, namespace_id) {
    try {
        const namespace = await Namespace.findOne({ 
            id_project: id_project,
            namespace: namespace_id 
        });
        return !!namespace; // return true if namespace exists, false otherwise
    } catch (err) {
        winston.error("validate namespace error: ", err);
        throw err;
    }
}

module.exports = router; 