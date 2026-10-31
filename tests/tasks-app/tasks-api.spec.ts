import { test, expect } from '@fixtures';
import { TasksApiClient } from '@api/TasksApiClient';
import { uniqueUser } from '@data/tasks';

test.describe('Tasks API', () => {
  test('rejects requests without a token', async ({ request }) => {
    const anon = new TasksApiClient(request);
    expect((await anon.listTasksRaw()).status()).toBe(401);
    expect((await anon.createTaskRaw({ title: 'x' })).status()).toBe(401);
  });

  test('cannot register the same username twice', async ({ request }) => {
    const api = new TasksApiClient(request);
    const user = uniqueUser();
    expect((await api.createUserRaw(user)).status()).toBe(201);
    expect((await api.createUserRaw(user)).status()).toBe(409);
  });

  test('wrong password returns 401', async ({ tasksApi, tasksUser }) => {
    const res = await tasksApi.loginRaw({ username: tasksUser.username, password: 'nope' });
    expect(res.status()).toBe(401);
  });

  test('create, read, update and delete a task @smoke', async ({ tasksApi }) => {
    const created = await tasksApi.createTask('  Pay invoice  ');
    expect(created).toMatchObject({ title: 'Pay invoice', done: false });
    expect(created.id).toEqual(expect.any(Number));
    expect(new Date(created.createdAt).toString()).not.toBe('Invalid Date');

    const updated = await (await tasksApi.updateTaskRaw(created.id, { done: true, title: 'Pay invoice #42' })).json();
    expect(updated).toMatchObject({ id: created.id, title: 'Pay invoice #42', done: true });

    expect((await tasksApi.deleteTaskRaw(created.id)).status()).toBe(204);
    expect((await tasksApi.getTaskRaw(created.id)).status()).toBe(404);
  });

  const invalidBodies = [
    { name: 'missing title', body: {} },
    { name: 'empty title', body: { title: '' } },
    { name: 'whitespace title', body: { title: '   ' } },
    { name: 'non-string title', body: { title: 123 } },
    { name: 'title over 120 chars', body: { title: 'a'.repeat(121) } },
  ];

  for (const { name, body } of invalidBodies) {
    test(`create rejects ${name}`, async ({ tasksApi }) => {
      const res = await tasksApi.createTaskRaw(body);
      expect(res.status()).toBe(400);
      expect(await res.json()).toHaveProperty('error');
    });
  }

  test('title of exactly 120 characters is accepted (boundary)', async ({ tasksApi }) => {
    const res = await tasksApi.createTaskRaw({ title: 'a'.repeat(120) });
    expect(res.status()).toBe(201);
  });

  test('update rejects a non-boolean done flag', async ({ tasksApi }) => {
    const task = await tasksApi.createTask('Check types');
    expect((await tasksApi.updateTaskRaw(task.id, { done: 'yes' })).status()).toBe(400);
  });
});
