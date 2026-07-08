const { Namespace, AnsweredQuestion, UnansweredQuestion } = require('../models/kb_setting');
const winston = require('../config/winston');

class KbQuestionService {
  
  constructor() {}

  async createAnsweredQuestion(id_project, data) {
    try {
      const { namespace, question, answer, tokens, request_id } = data;

      if (!namespace || !question || !answer) {
        throw new Error({ status: 422, error: 'Missing required parameters: namespace, question and answer' });
      }

      const isValidNamespace = await this.validateNamespace(id_project, namespace);
      if (!isValidNamespace) {
        throw new Error({ status: 403, error: 'Not allowed. The namespace does not belong to the current project.' });
      }

      const answeredQuestion = new AnsweredQuestion({
        id_project,
        namespace,
        question,
        answer,
        tokens,
        request_id,
      });

      return await answeredQuestion.save();

    } catch (error) {
      throw error;
    }
  }

  async createUnansweredQuestion(id_project, data) {
    try {
      const { namespace, question, request_id, sender } = data;

      if (!namespace || !question) {
        throw new Error({ status: 422, error: 'Missing required parameters: namespace and question' });
      }

      const isValidNamespace = await this.validateNamespace(id_project, namespace);
      if (!isValidNamespace) {
        throw new Error({ status: 403, error: 'Not allowed. The namespace does not belong to the current project.' });
      }

      const unansweredQuestion = new UnansweredQuestion({
        id_project,
        namespace,
        question,
        request_id,
        sender,
      });
      return await unansweredQuestion.save();

    } catch (error) {
      throw error;
    }
  }

  async validateNamespace(id_project, namespace_id) {
    try {
      const namespace = await Namespace.findOne({
        id_project: id_project,
        id: namespace_id
      });
      return !!namespace;
    } catch (error) {
      throw error;
    }
  }

  async trackKbQaResult(id_project, { namespace, question }, answer, tokens) {
    try {
      if (answer.success === true) {
        await this.createAnsweredQuestion(id_project, {
          namespace,
          question,
          answer: answer.answer,
          tokens,
        });
      } else if (answer.success === false) {
        await this.createUnansweredQuestion(id_project, { namespace, question });
      } else {
        winston.warn('qa answer.success is not true or false: ', answer.success);
      }
    } catch (error) {
      winston.error('qa err: ', error);
    }
  }

}

const kbQuestionService = new KbQuestionService();
module.exports = kbQuestionService;