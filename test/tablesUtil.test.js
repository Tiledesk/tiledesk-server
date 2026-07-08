process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const {
  buildConditionsQuery,
  buildUpdateSet,
  isSafeColumnName,
} = require('../utils/tablesUtil');
const {
  resolveColumnId,
  resolveDataKeys,
} = require('../utils/tablesColumnResolver');

const COLUMNS = [
  { id: 'col_email', name: 'email', type: 'string', index: 0 },
  { id: 'col_age', name: 'age', type: 'number', index: 1 },
  { id: 'col_token', name: 'token', type: 'string', index: 2 },
  { id: 'col_fullname', name: 'fullname', type: 'string', index: 3 },
  { id: 'col_code', name: 'code', type: 'string', index: 4 },
];

describe('tablesUtil', () => {

  describe('isSafeColumnName', () => {
    it('rejects dangerous column names', () => {
      expect(isSafeColumnName('__proto__')).to.be.false;
      expect(isSafeColumnName('constructor')).to.be.false;
      expect(isSafeColumnName('$where')).to.be.false;
      expect(isSafeColumnName('data.email')).to.be.false;
    });
  });

  describe('resolveColumnId', () => {
    it('maps columnId to storage key in row data', () => {
      expect(resolveColumnId(COLUMNS, 'col_email')).to.equal('email');
    });

    it('uses key not display name after rename', () => {
      const schema = [
        { id: 'col_email', name: 'email_address', key: 'email', type: 'string', index: 0 },
      ];
      expect(resolveColumnId(schema, 'col_email')).to.equal('email');
    });

    it('throws for unknown columnId', () => {
      expect(() => resolveColumnId(COLUMNS, 'col_missing')).to.throw('Unknown columnId');
    });
  });

  describe('resolveDataKeys', () => {
    it('accepts columnId keys', () => {
      const resolved = resolveDataKeys({ col_token: 'abc', col_code: 'x' }, COLUMNS);
      expect(resolved).to.deep.equal({ token: 'abc', code: 'x' });
    });

    it('accepts legacy column name keys with deprecation callback', () => {
      const warnings = [];
      const resolved = resolveDataKeys({ token: 'abc' }, COLUMNS, msg => warnings.push(msg));
      expect(resolved).to.deep.equal({ token: 'abc' });
      expect(warnings.length).to.be.equal(1);
    });
  });

  describe('buildUpdateSet', () => {
    it('builds dot-notation $set paths from columnId keys', () => {
      const result = buildUpdateSet({ col_token: 'abc', col_code: 'pro' }, COLUMNS);
      expect(result).to.deep.equal({
        $set: {
          'data.token': 'abc',
          'data.code': 'pro',
        },
      });
    });

    it('builds dot-notation $set paths from legacy column names', () => {
      const result = buildUpdateSet({ token: 'abc', plan: 'pro' }, [
        ...COLUMNS,
        { id: 'col_plan', name: 'plan', type: 'string', index: 5 },
      ]);
      expect(result).to.deep.equal({
        $set: {
          'data.token': 'abc',
          'data.plan': 'pro',
        },
      });
    });

    it('rejects columns not in schema', () => {
      expect(() => buildUpdateSet({ hacker: 'x' }, COLUMNS)).to.throw('Column not allowed');
    });
  });

  describe('buildConditionsQuery', () => {
    it('builds $and query from columnId when must_match is all', () => {
      const result = buildConditionsQuery(
        [
          { columnId: 'col_email', condition: 'Equal', value: 'mario@test.it' },
          { columnId: 'col_age', condition: 'Greater than', value: 18 },
        ],
        'all',
        COLUMNS
      );

      expect(result).to.deep.equal({
        $and: [
          { 'data.email': 'mario@test.it' },
          { 'data.age': { $gt: 18 } },
        ],
      });
    });

    it('builds $and query when must_match is all (legacy column names)', () => {
      const result = buildConditionsQuery(
        [
          { column: 'email', condition: 'Equal', value: 'mario@test.it' },
          { column: 'age', condition: 'Greater than', value: 18 },
        ],
        'all',
        COLUMNS
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
          { columnId: 'col_email', condition: 'Equal', value: 'a@test.it' },
          { columnId: 'col_email', condition: 'Equal', value: 'b@test.it' },
        ],
        'any',
        COLUMNS
      );

      expect(result.$or).to.have.length(2);
    });

    it('maps Contains to escaped regex', () => {
      const result = buildConditionsQuery(
        [{ columnId: 'col_email', condition: 'Contains', value: 'test+special' }],
        'all',
        COLUMNS
      );

      expect(result.$and[0]['data.email'].$regex).to.equal('test\\+special');
    });

    it('rejects columns not in schema', () => {
      expect(() => buildConditionsQuery(
        [{ column: '__proto__', condition: 'Equal', value: 'x' }],
        'all',
        COLUMNS
      )).to.throw('Invalid column');
    });
  });
});
