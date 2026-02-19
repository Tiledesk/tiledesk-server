function buildDbUri(baseUri, dbName) {
  if (!baseUri) return baseUri;

  const [head, query] = baseUri.split('?', 2);

  const schemeIdx = head.indexOf('://');
  if (schemeIdx === -1) return baseUri;

  const pathIdx = head.indexOf('/', schemeIdx + 3);
  const prefix = pathIdx === -1 ? head : head.slice(0, pathIdx);

  const rebuilt = `${prefix}/${dbName}`;
  return query ? `${rebuilt}?${query}` : rebuilt;
}

const DEFAULT_MAIN = 'mongodb://localhost:27017/tiledesk';
const mainUri = process.env.MONGODB_URI || DEFAULT_MAIN;

module.exports = {
  buildDbUri,
  secret: process.env.JWT_SECRET || 'nodeauthsecret',
  schemaVersion: 2111,
  database: mainUri,
  databaselogs: process.env.MONGODB_URI_LOGS || buildDbUri(mainUri, 'tiledesk-logs'),
  databasetest: process.env.MONGODB_URI_TEST || buildDbUri(mainUri, 'tiledesk-test')
};
