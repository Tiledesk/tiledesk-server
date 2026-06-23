const assert = require('assert');
const { buildDbUri } = require('../../config/database');

describe('buildDbUri', () => {

  it('replaces the db name in a standard URI', () => {
    const result = buildDbUri('mongodb://localhost:27017/tiledesk', 'tiledesk-logs');
    assert.strictEqual(result, 'mongodb://localhost:27017/tiledesk-logs');
  });

  it('handles mongodb+srv with query params', () => {
    const base = 'mongodb+srv://user:pass@cluster.example.com/mydb?retryWrites=true';
    const result = buildDbUri(base, 'tiledesk-logs');
    assert.strictEqual(result, 'mongodb+srv://user:pass@cluster.example.com/tiledesk-logs?retryWrites=true');
  });

  it('handles URI without a db path', () => {
    const result = buildDbUri('mongodb://localhost:27017', 'tiledesk-logs');
    assert.strictEqual(result, 'mongodb://localhost:27017/tiledesk-logs');
  });

  it('handles URI with auth credentials', () => {
    const base = 'mongodb://admin:secret@host1:27017,host2:27017/proddb?authSource=admin';
    const result = buildDbUri(base, 'tiledesk-logs');
    assert.strictEqual(result, 'mongodb://admin:secret@host1:27017,host2:27017/tiledesk-logs?authSource=admin');
  });

  it('returns undefined when input is undefined', () => {
    assert.strictEqual(buildDbUri(undefined, 'db'), undefined);
  });

  it('returns empty string when input is empty', () => {
    assert.strictEqual(buildDbUri('', 'db'), '');
  });

  it('returns input unchanged when no scheme is found', () => {
    assert.strictEqual(buildDbUri('not-a-uri', 'db'), 'not-a-uri');
  });
});