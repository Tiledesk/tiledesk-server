const BSON = require('bson');
const bson = new BSON();

function calculateBsonSize(document) {
  if (document == null) return 0;
  const plain = document.toObject ? document.toObject({ depopulate: true }) : document;
  return bson.calculateObjectSize(plain);
}

module.exports = {
  calculateBsonSize: calculateBsonSize,
};
