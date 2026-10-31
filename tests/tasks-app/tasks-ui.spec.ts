import { test, expect } from '@fixtures';
import { TasksApiClient } from '@api/TasksApiClient';
import { taskTitles, uniqueUser } from '@data/tasks';

// Pattern: seed through the API, act in the UI, verify in both the UI and the API.
test.describe('Tasks UI with API-seeded data', () => {
  test('shows tasks created through the API @smoke', async ({ tasksApi, tasksPage, tasksUser }) => {
    const titles = taskTitles(3);
    await tasksApi.createTasks(titles);

    await tasksPage.goto();

    await expect(tasksPage.currentUser).toHaveText(tasksUser.username);
    await expect(tasksPage.titles).toHaveText(titles);
    await expect(tasksPage.remaining).toHaveText('3 of 3 remaining');
  });

  test('shows the empty state for a new user', async ({ tasksPage }) => {
    await tasksPage.goto();
    await expect(tasksPage.emptyState).toBeVisible();
    await expect(tasksPage.items).toHaveCount(0);
  });

  test('task added in the UI is saved through the API', async ({ tasksApi, tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.addTask('Write release notes');

    await expect(tasksPage.item('Write release notes')).toBeVisible();
    await expect(tasksPage.newTaskInput).toHaveValue('');
    await expect.poll(async () => (await tasksApi.listTasks()).map((t) => t.title)).toEqual(['Write release notes']);
  });

  test('completing a task in the UI updates the API', async ({ tasksApi, tasksPage }) => {
    const [first, second] = await tasksApi.createTasks(taskTitles(2));
    await tasksPage.goto();

    await tasksPage.toggle(first.title);

    await expect(tasksPage.item(first.title)).toHaveClass(/done/);
    await expect(tasksPage.remaining).toHaveText('1 of 2 remaining');
    await expect.poll(async () => (await tasksApi.listTasks()).find((t) => t.id === first.id)?.done).toBe(true);
    expect((await tasksApi.listTasks()).find((t) => t.id === second.id)?.done).toBe(false);
  });

  test('task completed through the API shows as done in the UI', async ({ tasksApi, tasksPage }) => {
    const [task] = await tasksApi.createTasks(taskTitles(1));
    await tasksApi.completeTask(task.id);

    await tasksPage.goto();

    await expect(tasksPage.item(task.title)).toHaveClass(/done/);
    await expect(tasksPage.item(task.title).getByTestId('task-toggle')).toBeChecked();
  });

  test('deleting a task in the UI removes it from the API', async ({ tasksApi, tasksPage }) => {
    const [keep, remove] = await tasksApi.createTasks(taskTitles(2));
    await tasksPage.goto();

    await tasksPage.delete(remove.title);

    await expect(tasksPage.titles).toHaveText([keep.title]);
    expect((await tasksApi.getTaskRaw(remove.id)).status()).toBe(404);
  });

  test('rejects a title over 120 characters', async ({ tasksApi, tasksPage }) => {
    await tasksPage.goto();
    await tasksPage.addTask('x'.repeat(121));

    await expect(tasksPage.error).toHaveText('title must be 1-120 characters');
    expect(await tasksApi.listTasks()).toHaveLength(0);
  });

  test("users cannot see each other's tasks", async ({ tasksApi, tasksPage, playwright, baseURL }) => {
    // A second, independent user seeds a private task
    const otherRequest = await playwright.request.newContext({ baseURL });
    const other = new TasksApiClient(otherRequest);
    await other.register(uniqueUser());
    const secret = await other.createTask('Secret task of another user');

    await tasksApi.createTask('My own task');
    await tasksPage.goto();

    await expect(tasksPage.titles).toHaveText(['My own task']);
    expect((await tasksApi.getTaskRaw(secret.id)).status()).toBe(404);
    await otherRequest.dispose();
  });
});

test.describe('Tasks login', () => {
  test('logs in through the form and logs out', async ({ page, tasksApi, tasksUser, tasksLoginPage }) => {
    void tasksApi; // the fixture registers tasksUser through the API
    await tasksLoginPage.goto();
    await tasksLoginPage.login(tasksUser.username, tasksUser.password);

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('current-user')).toHaveText(tasksUser.username);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/); // session is gone
  });

  test('shows an error for a wrong password', async ({ page, tasksApi, tasksUser, tasksLoginPage }) => {
    void tasksApi;
    await tasksLoginPage.goto();
    await tasksLoginPage.login(tasksUser.username, 'wrong-password');

    await expect(tasksLoginPage.error).toHaveText('Invalid username or password');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Tasks visual @visual', () => {
  test('task list with mixed states', async ({ page, tasksApi, tasksPage }) => {
    const tasks = await tasksApi.createTasks(['Buy milk', 'Book flights', 'Renew passport']);
    await tasksApi.completeTask(tasks[1].id);
    await tasksPage.goto();
    await expect(tasksPage.items).toHaveCount(3);
    // Mask the random username so the screenshot is deterministic
    await expect(page).toHaveScreenshot('task-list.png', { mask: [tasksPage.currentUser] });
  });
});
