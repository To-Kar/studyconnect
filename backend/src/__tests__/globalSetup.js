require('ts-node/register/transpile-only');
const { startPostgres } = require('./testutils/test-container');

module.exports = async () => {
  await startPostgres();
  const { runMigrations, seedDatabase } = require('../lib/migrations');
  await runMigrations();
  await seedDatabase();
};
