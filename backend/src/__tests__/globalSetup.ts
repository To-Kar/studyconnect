// backend/src/__tests__/globalSetup.ts
import { startPostgres } from './testutils/test-container';

module.exports = async () => {
  await startPostgres(); // sets DB_* env vars
  const { runMigrations, seedDatabase } = await import('../lib/migrations'); // import after env is set
  await runMigrations();
  await seedDatabase();
};
