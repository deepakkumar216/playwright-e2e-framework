export const SAUCE_URL = process.env.SAUCE_BASE_URL ?? 'https://www.saucedemo.com';
export const TASKS_PORT = Number(process.env.TASKS_PORT ?? 3100);
export const TASKS_URL = `http://localhost:${TASKS_PORT}`;
export const SAUCE_AUTH_FILE = '.auth/saucedemo-standard-user.json';
