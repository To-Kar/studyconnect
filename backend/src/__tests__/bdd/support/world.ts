import { setWorldConstructor } from "@cucumber/cucumber";
import type { Response } from "supertest";

export class CustomWorld {
  baseUrl: string;
  authToken?: string;
  lastResponse?: Response;
  currentTaskId?: string;
  groupId?: string;
  constructor() {
    // default to local dev; overridden by CI via env
    this.baseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
  }
}
setWorldConstructor(CustomWorld);