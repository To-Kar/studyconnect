import { BeforeAll, AfterAll } from "@cucumber/cucumber";
import { startServer } from "../../../server";
import type { Server } from 'http';

let server: Server;

BeforeAll(async () => {
  process.env.BDD_MODE = 'true';
  server = await startServer();
});

AfterAll(async () => {
  if (server) {
    server.close();
  }
});