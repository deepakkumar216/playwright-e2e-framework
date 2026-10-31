import { faker } from '@faker-js/faker';
import type { Credentials } from '@api/TasksApiClient';

/** A unique user per test, so parallel workers never share data. */
export function uniqueUser(): Credentials {
  return {
    username: `user_${faker.string.alphanumeric(10).toLowerCase()}`,
    password: faker.internet.password({ length: 12 }),
  };
}

export function taskTitles(count: number): string[] {
  return Array.from({ length: count }, () => faker.hacker.phrase().slice(0, 80));
}
