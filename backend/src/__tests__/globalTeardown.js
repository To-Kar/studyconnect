require('ts-node/register/transpile-only');
const { stopPostgres } = require('./testutils/test-container');

module.exports = async () => {
  await stopPostgres();
};
