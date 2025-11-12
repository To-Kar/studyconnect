import { setWorldConstructor, World, IWorldOptions } from "@cucumber/cucumber";
import { AxiosResponse } from "axios"; // Annahme: Wir verwenden axios

export class ApiClient {
  private authToken: string | null = null;
  private baseUrl = "http://localhost:8080"; // Annahme: API-Basis-URL

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
  
  async post(path: string, body: any): Promise<AxiosResponse> {
    console.log(`MOCK POST: ${this.baseUrl}${path}`, body);
    if (path === "/register" && body.email === "existing@example.com") {
      return Promise.resolve({
        status: 409,
        data: { message: "User with this email or username already exists" },
      } as AxiosResponse);
    }
    if (path === "/register") {
      return Promise.resolve({
        status: 201,
        data: { userId: "user-123", username: body.username },
      } as AxiosResponse);
    }
    if (path === "/login" && body.password === "incorrect-password") {
       return Promise.resolve({
        status: 401,
        data: { message: "Invalid credentials" },
      } as AxiosResponse);
    }
    if (path === "/login") {
       return Promise.resolve({
        status: 200,
        data: { token: "fake-jwt-token" },
      } as AxiosResponse);
    }
    if (path === "/tasks") {
      return Promise.resolve({ status: 201, data: { ...body, id: "task-456" } } as AxiosResponse);
    }
    if (path.includes("/join")) {
       if (path.includes("non-existent-id-123")) {
         return Promise.resolve({ status: 404, data: { message: "Group not found"} } as AxiosResponse);
       }
       return Promise.resolve({ status: 201, data: { memberId: "user-123" } } as AxiosResponse);
    }
    return Promise.resolve({ status: 200, data: {} } as AxiosResponse);
  }

  async put(path: string, body: any): Promise<AxiosResponse> {
    console.log(`MOCK PUT: ${this.baseUrl}${path}`, body);
    return Promise.resolve({ status: 200, data: { ...body, id: path.split('/')[2] } } as AxiosResponse);
  }
  
  async get(path: string): Promise<AxiosResponse> {
    console.log(`MOCK GET: ${this.baseUrl}${path}`);
    if (path === "/me") {
        return Promise.resolve({ status: 200, data: { points: 10 } } as AxiosResponse);
    }
    if (path.includes("/members")) {
        return Promise.resolve({ status: 200, data: [{ userId: "user-123" }] } as AxiosResponse);
    }
    return Promise.resolve({ status: 200, data: {} } as AxiosResponse);
  }
  getUserId(): string {
    return "user-123";
  }
}

export class CustomWorld extends World {
  apiClient: ApiClient;
  lastResponse: AxiosResponse;
  
  lastTaskId?: string;
  lastGroupId?: string;
  joinableGroupId?: string;
  newTitle?: string;
  username?: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.apiClient = new ApiClient();
  }
}

// Registriere den CustomWorld
setWorldConstructor(CustomWorld);
