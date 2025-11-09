import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { startServer } from "../../../server";
import pool from "../../../lib/database";
import type { Server } from 'http';

let server: Server;

BeforeAll(async () => {
  process.env.BDD_MODE = 'true';
  server = await startServer();
});

AfterAll(async () => {
  // Close HTTP server
  if (server) {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
  // Close database connections
  try {
    await pool.end();
  } catch {}
  // Give Cucumber a moment to print the summary, then exit to avoid hanging
  const shouldForceExit = process.env.CI === 'true' || process.env.FORCE_BDD_EXIT === 'true' || process.env.FORCE_BDD_EXIT === undefined;
  if (shouldForceExit) {
    setTimeout(() => process.exit(0), 750);
  }
});