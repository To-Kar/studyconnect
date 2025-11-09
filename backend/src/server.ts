import app from './app';
import { runMigrations, seedDatabase } from './lib/migrations';
import type { Server } from 'http';

export async function startServer(): Promise<Server> {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, async () => {
    console.log(`🚀 StudyConnect API running on http://localhost:${PORT}`);
    try {
      await runMigrations();
      await seedDatabase();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    }
  });
  return server;
}

export default app;
