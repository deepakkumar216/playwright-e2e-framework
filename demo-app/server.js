// Tiny "Tasks" app used as a self-contained system under test.
// Zero dependencies: Node's http module, in-memory storage, a REST API and a static UI.
// Start: node demo-app/server.js  (PORT env var, default 3100)

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3100);
const PUBLIC_DIR = path.join(__dirname, 'public');

const users = new Map();   // username -> { username, password }
const sessions = new Map(); // token -> username
const tasks = new Map();   // username -> Map(id -> task)
let nextId = 1;

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

function currentUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  return token ? sessions.get(token) : undefined;
}

function validTitle(title) {
  return typeof title === 'string' && title.trim().length > 0 && title.length <= 120;
}

async function handleApi(req, res, url) {
  const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readJson(req) : {};
  if (body === null) return send(res, 400, { error: 'Invalid JSON' });

  if (req.method === 'POST' && url.pathname === '/api/users') {
    const { username, password } = body;
    if (!username || !password) return send(res, 400, { error: 'username and password are required' });
    if (users.has(username)) return send(res, 409, { error: 'username already taken' });
    users.set(username, { username, password });
    tasks.set(username, new Map());
    return send(res, 201, { username });
  }

  if (req.method === 'POST' && url.pathname === '/api/login') {
    const user = users.get(body.username);
    if (!user || user.password !== body.password) return send(res, 401, { error: 'Invalid username or password' });
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, user.username);
    return send(res, 200, { token, username: user.username });
  }

  const username = currentUser(req);
  if (!username) return send(res, 401, { error: 'Unauthorized' });
  const mine = tasks.get(username);

  if (url.pathname === '/api/tasks') {
    if (req.method === 'GET') {
      return send(res, 200, [...mine.values()].sort((a, b) => a.id - b.id));
    }
    if (req.method === 'POST') {
      if (!validTitle(body.title)) return send(res, 400, { error: 'title must be 1-120 characters' });
      const task = { id: nextId++, title: body.title.trim(), done: false, createdAt: new Date().toISOString() };
      mine.set(task.id, task);
      return send(res, 201, task);
    }
  }

  const match = url.pathname.match(/^\/api\/tasks\/(\d+)$/);
  if (match) {
    const task = mine.get(Number(match[1]));
    if (!task) return send(res, 404, { error: 'Task not found' });
    if (req.method === 'GET') return send(res, 200, task);
    if (req.method === 'PATCH') {
      if (body.title !== undefined && !validTitle(body.title)) {
        return send(res, 400, { error: 'title must be 1-120 characters' });
      }
      if (body.done !== undefined && typeof body.done !== 'boolean') {
        return send(res, 400, { error: 'done must be a boolean' });
      }
      if (body.title !== undefined) task.title = body.title.trim();
      if (body.done !== undefined) task.done = body.done;
      return send(res, 200, task);
    }
    if (req.method === 'DELETE') {
      mine.delete(task.id);
      res.writeHead(204);
      return res.end();
    }
  }

  return send(res, 404, { error: 'Not found' });
}

function serveStatic(res, pathname) {
  const routes = { '/': 'index.html', '/login': 'login.html' };
  const file = routes[pathname] || pathname.slice(1);
  const full = path.join(PUBLIC_DIR, path.normalize(file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
  res.writeHead(200, { 'Content-Type': types[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/health') return send(res, 200, { status: 'ok' });
  if (url.pathname.startsWith('/api/')) {
    return handleApi(req, res, url).catch((err) => {
      console.error(err);
      send(res, 500, { error: 'Internal error' });
    });
  }
  return serveStatic(res, url.pathname);
});

server.listen(PORT, () => console.log(`Tasks demo app listening on http://localhost:${PORT}`));
