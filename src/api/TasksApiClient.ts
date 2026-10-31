import { expect, type APIRequestContext, type APIResponse } from '@playwright/test';

export interface Task {
  id: number;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Credentials {
  username: string;
  password: string;
}

/** Typed client for the Tasks REST API. Used to seed and verify data around UI tests. */
export class TasksApiClient {
  private token?: string;

  constructor(private readonly request: APIRequestContext) {}

  get authToken(): string {
    if (!this.token) throw new Error('Not logged in: call register()/login() first');
    return this.token;
  }

  private headers(): Record<string, string> {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  // ---- raw calls: return the response so tests can assert on status codes ----

  createUserRaw(creds: Partial<Credentials>): Promise<APIResponse> {
    return this.request.post('/api/users', { data: creds });
  }

  loginRaw(creds: Partial<Credentials>): Promise<APIResponse> {
    return this.request.post('/api/login', { data: creds });
  }

  listTasksRaw(): Promise<APIResponse> {
    return this.request.get('/api/tasks', { headers: this.headers() });
  }

  createTaskRaw(body: unknown): Promise<APIResponse> {
    return this.request.post('/api/tasks', { data: body, headers: this.headers() });
  }

  updateTaskRaw(id: number, body: unknown): Promise<APIResponse> {
    return this.request.patch(`/api/tasks/${id}`, { data: body, headers: this.headers() });
  }

  deleteTaskRaw(id: number): Promise<APIResponse> {
    return this.request.delete(`/api/tasks/${id}`, { headers: this.headers() });
  }

  getTaskRaw(id: number): Promise<APIResponse> {
    return this.request.get(`/api/tasks/${id}`, { headers: this.headers() });
  }

  // ---- convenience calls: assert success and return typed data ----

  async register(creds: Credentials): Promise<void> {
    const res = await this.createUserRaw(creds);
    expect(res.status(), await res.text()).toBe(201);
    await this.login(creds);
  }

  async login(creds: Credentials): Promise<string> {
    const res = await this.loginRaw(creds);
    expect(res.status(), await res.text()).toBe(200);
    this.token = (await res.json()).token;
    return this.authToken;
  }

  async createTask(title: string): Promise<Task> {
    const res = await this.createTaskRaw({ title });
    expect(res.status(), await res.text()).toBe(201);
    return res.json();
  }

  async createTasks(titles: string[]): Promise<Task[]> {
    const created: Task[] = [];
    for (const t of titles) created.push(await this.createTask(t)); // sequential keeps IDs ordered
    return created;
  }

  async completeTask(id: number): Promise<Task> {
    const res = await this.updateTaskRaw(id, { done: true });
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }

  async listTasks(): Promise<Task[]> {
    const res = await this.listTasksRaw();
    expect(res.status(), await res.text()).toBe(200);
    return res.json();
  }
}
