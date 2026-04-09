const express = require('express');
const router = express.Router();
const { Namespace, AnsweredQuestion } = require('../models/kb_setting');
const winston = require('../config/winston');

// Add a new unanswerd question
router.post('/', async (req, res) => {
    try {
        const { namespace, question, answer } = req.body;
        const id_project = req.projectid;

        if (!namespace || !question || !answer) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameters: namespace, question and answer"
            })
        }

        // Check if namespae belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            })
        }

        const answeredQuestion = new AnsweredQuestion({
            id_project,
            namespace,
            question,
            answer
        });

        const savedQuestion = await answeredQuestion.save();
        res.status(200).json(savedQuestion);

    } catch (error) {
        winston.error('Error adding answered question:', error);
        res.status(500).json({
            success: false,
            error: "Error adding answered question"
        });
    }
})

// Get all answered questions for a namespace
router.get('/:namespace', async (req, res) => {

    try {
        const { namespace } = req.params;
        const id_project = req.projectid;

        if (!namespace) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter: namespace"
            })
        }

        // Check if namespace belongs to project
        const isValidNamespace = await validateNamespace(id_project, namespace);
        if (!isValidNamespace) {
            return res.status(403).json({
                success: false,
                error: "Not allowed. The namespace does not belong to the current project."
            })
        }
        
        const page = parseInt(req.query.page) || 0;
        const limit = parseInt(req.query.limit) || 20;
        const sortField = req.query.sortField || 'created_at';
        const direction = parseInt(req.query.direction) || -1;

        const filter = { id_project, namespace };

        let projection = undefined;

        if (req.query.search) {
            filter.$text = { $search: req.query.search };
            // Add score to projection if it's a text search
            projection = { score: { $meta: "textScore" } };
        }

        let sortObj;
        if (projection && projection.score) {
            sortObj = { score: { $meta: "textScore" } };
        } else {
            sortObj = { [sortField]: direction };
        }

        const query = AnsweredQuestion.find(filter, projection)
            .sort(sortObj)
            .skip(page * limit)
            .limit(limit);

        const questions = await query;

        const count = await query.countDocuments();

        res.status(200).json({
            count,
            questions,
            query: {
                page,
                limit,
                sortField,
                direction,
                search: req.query.search || undefined
            }
        });
        
    } catch (error) {
        winston.error('Error getting answered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error getting answered questions"
        });
    }

})

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const id_project = req.projectid;

        const deleted = await AnsweredQuestion.findOneAndDelete({ _id: id, id_project });
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: "Question not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Question deleted successfully"
        });

    } catch (error) {
        winston.error('Error deleting answered question:', error);
        res.status(500).json({
            success: false,
            error: "Error deleting answered question"
        });
    }
})

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
        
        const result = await AnsweredQuestion.deleteMany({ id_project, namespace });
        res.status(200).json({
            success: true,
            count: result.deletedCount,
            message: "All questions deleted successfully"
        });

    } catch (error) {
        winston.error('Error deleting answered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error deleting answered questions"
        });
    }
})

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

        const count = await AnsweredQuestion.countDocuments({ id_project, namespace });
        res.status(200).json({ count });

    } catch (error) {
        winston.error('Error counting answered questions:', error);
        res.status(500).json({
            success: false,
            error: "Error counting answered questions"
        });
    }
})

// Helper function to validate namespace
async function validateNamespace(id_project, namespace_id) {
    try {
        const namespace = await Namespace.findOne({
            id_project: id_project,
            id: namespace_id
        });
        return !!namespace;
    } catch (err) {
        winston.error('validate namespace error: ', err);
        throw err;
    }
}

module.exports = router;