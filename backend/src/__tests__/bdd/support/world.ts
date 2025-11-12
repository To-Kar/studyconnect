import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { Response } from "supertest";

export class CustomWorld extends World {
  baseUrl: string;
  authToken?: string;
  lastResponse?: Response;
  currentTaskId?: string;
  groupId?: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseUrl = "http://localhost:3000";
  }
}

// Registriere den CustomWorld
setWorldConstructor(CustomWorld);
