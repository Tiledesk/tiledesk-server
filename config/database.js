module.exports = {
  secret: process.env.JWT_SECRET,
  schemaVersion: 2111, 
  database: 'mongodb://localhost:27017/tiledesk',
  databaselogs: 'mongodb://localhost:27017/tiledesk-logs',
  databasetest: 'mongodb://localhost:27017/tiledesk-test'
};
