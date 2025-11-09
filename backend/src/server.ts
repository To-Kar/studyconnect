import app from './app';
import { runMigrations, seedDatabase } from './lib/migrations';
import pool from './lib/database';
import type { Server } from 'http';

async function ensureDatabaseReady(retries = 30, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return; // DB reachable
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

export async function startServer(): Promise<Server> {
  const PORT = process.env.PORT || 3000;

  // Ensure database is reachable and initialized before accepting requests
  await ensureDatabaseReady();
  await runMigrations();
  await seedDatabase();

  const server = app.listen(PORT, () => {
    console.log(`🚀 StudyConnect API running on http://localhost:${PORT}`);
  });
  return server;
}

export default app;
