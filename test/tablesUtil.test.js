process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const {
  buildConditionsQuery,
  buildUpdateSet,
  isSafeColumnName,
} = require('../utils/tablesUtil');

const SCHEMA_COLUMNS = ['email', 'age', 'token', 'fullname', 'code'];

describe('tablesUtil', () => {

  describe('isSafeColumnName', () => {
    it('rejects dangerous column names', () => {
      expect(isSafeColumnName('__proto__')).to.be.false;
      expect(isSafeColumnName('constructor')).to.be.false;
      expect(isSafeColumnName('$where')).to.be.false;
      expect(isSafeColumnName('data.email')).to.be.false;
    });
  });

  describe('buildUpdateSet', () => {
    it('builds dot-notation $set paths', () => {
      const result = buildUpdateSet({ token: 'abc', plan: 'pro' }, ['token', 'plan']);
      expect(result).to.deep.equal({
        $set: {
          'data.token': 'abc',
          'data.plan': 'pro',
        },
      });
    });

    it('rejects columns not in schema', () => {
      expect(() => buildUpdateSet({ hacker: 'x' }, SCHEMA_COLUMNS)).to.throw('Column not allowed');
    });
  });

  describe('buildConditionsQuery', () => {
    it('builds $and query when must_match is all', () => {
      const result = buildConditionsQuery(
        [
          { column: 'email', condition: 'Equal', value: 'mario@test.it' },
          { column: 'age', condition: 'Greater than', value: 18 },
        ],
        'all',
        SCHEMA_COLUMNS
      );

      expect(result).to.deep.equal({
        $and: [
          { 'data.email': 'mario@test.it' },
          { 'data.age': { $gt: 18 } },
        ],
      });
    });

    it('builds $or query when must_match is any', () => {
      const result = buildConditionsQuery(
        [
          { column: 'email', condition: 'Equal', value: 'a@test.it' },
          { column: 'email', condition: 'Equal', value: 'b@test.it' },
        ],
        'any',
        SCHEMA_COLUMNS
      );

      expect(result.$or).to.have.length(2);
    });

    it('maps Contains to escaped regex', () => {
      const result = buildConditionsQuery(
        [{ column: 'email', condition: 'Contains', value: 'test+special' }],
        'all',
        SCHEMA_COLUMNS
      );

      expect(result.$and[0]['data.email'].$regex).to.equal('test\\+special');
    });

    it('rejects columns not in schema', () => {
      expect(() => buildConditionsQuery(
        [{ column: '__proto__', condition: 'Equal', value: 'x' }],
        'all',
        SCHEMA_COLUMNS
      )).to.throw('Invalid column');
    });
  });
});
