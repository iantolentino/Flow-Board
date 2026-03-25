const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'my-secret-key-change-this';

// Database setup
let db;

async function initDatabase() {
  try {
    // Use /tmp for Vercel (writable directory)
    const dbPath = '/tmp/myboard.db';
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_guest INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        description TEXT,
        due_date TEXT,
        priority TEXT,
        status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS vault_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        site_name TEXT,
        username TEXT,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS budget_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        date TEXT,
        type TEXT,
        category TEXT,
        amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      
      CREATE TABLE IF NOT EXISTS budget_totals (
        user_id TEXT PRIMARY KEY,
        total_money REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    
    console.log('✅ Database initialized');
  } catch (error) {
    console.error('Database error:', error);
  }
}

// Auth middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.user = { id: 'guest', isGuest: true };
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT * FROM users WHERE id = ?', decoded.id);
    req.user = user || { id: 'guest', isGuest: true };
    next();
  } catch (err) {
    req.user = { id: 'guest', isGuest: true };
    next();
  }
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(authenticate);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  const existing = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (existing) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const id = Date.now().toString();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await db.run(
    'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
    [id, username, email, hashedPassword]
  );
  
  const user = { id, username, email };
  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ user, token });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.get('SELECT * FROM users WHERE email = ?', email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: { id: user.id, username: user.username, email: user.email }, token });
});

app.post('/api/auth/guest', async (req, res) => {
  const id = `guest_${Date.now()}`;
  const username = `Guest_${Math.random().toString(36).substring(7)}`;
  
  await db.run(
    'INSERT INTO users (id, username, is_guest) VALUES (?, ?, 1)',
    [id, username]
  );
  
  const user = { id, username, isGuest: true };
  const token = jwt.sign({ id, username, isGuest: true }, JWT_SECRET, { expiresIn: '1d' });
  
  res.json({ user, token, isGuest: true });
});

app.get('/api/auth/validate', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.isGuest) {
      return res.json({ user: decoded });
    }
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ?', decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Tasks routes
app.get('/api/tasks', async (req, res) => {
  const tasks = await db.all('SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC', req.user.id);
  res.json({ tasks });
});

app.post('/api/tasks', async (req, res) => {
  const { title, description, due_date, priority, status } = req.body;
  const id = Date.now().toString();
  
  await db.run(
    'INSERT INTO tasks (id, user_id, title, description, due_date, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.user.id, title, description, due_date || null, priority || 'medium', status || 'todo']
  );
  
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', id);
  res.status(201).json(task);
});

app.put('/api/tasks/:id', async (req, res) => {
  const { title, description, due_date, priority, status } = req.body;
  
  await db.run(
    'UPDATE tasks SET title = COALESCE(?, title), description = COALESCE(?, description), due_date = COALESCE(?, due_date), priority = COALESCE(?, priority), status = COALESCE(?, status) WHERE id = ? AND user_id = ?',
    [title, description, due_date, priority, status, req.params.id, req.user.id]
  );
  
  const task = await db.get('SELECT * FROM tasks WHERE id = ?', req.params.id);
  res.json(task);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.status(204).send();
});

// Calendar routes
app.get('/api/calendar/tasks', async (req, res) => {
  const { year, month } = req.query;
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
  
  const tasks = await db.all(
    'SELECT * FROM tasks WHERE user_id = ? AND due_date BETWEEN ? AND ? ORDER BY due_date',
    [req.user.id, startDate, endDate]
  );
  
  res.json(tasks);
});

// Vault routes
app.get('/api/vault/entries', async (req, res) => {
  const entries = await db.all(
    'SELECT id, site_name, username, created_at FROM vault_entries WHERE user_id = ? ORDER BY created_at DESC',
    req.user.id
  );
  res.json(entries);
});

app.post('/api/vault/entries', async (req, res) => {
  const { site_name, username, password } = req.body;
  const id = Date.now().toString();
  
  await db.run(
    'INSERT INTO vault_entries (id, user_id, site_name, username, password) VALUES (?, ?, ?, ?, ?)',
    [id, req.user.id, site_name, username, password]
  );
  
  const entry = await db.get('SELECT id, site_name, username, created_at FROM vault_entries WHERE id = ?', id);
  res.status(201).json(entry);
});

app.get('/api/vault/entries/:id/decrypt', async (req, res) => {
  const entry = await db.get('SELECT password FROM vault_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json({ password: entry.password });
});

app.delete('/api/vault/entries/:id', async (req, res) => {
  await db.run('DELETE FROM vault_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.status(204).send();
});

// Budget routes
app.get('/api/budget/entries', async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const entries = await db.all(
    'SELECT * FROM budget_entries WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?',
    [req.user.id, parseInt(limit), parseInt(offset)]
  );
  res.json({ entries });
});

app.post('/api/budget/entries', async (req, res) => {
  const { date, type, category, amount } = req.body;
  const id = Date.now().toString();
  
  await db.run(
    'INSERT INTO budget_entries (id, user_id, date, type, category, amount) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.user.id, date, type, category, amount]
  );
  
  const entry = await db.get('SELECT * FROM budget_entries WHERE id = ?', id);
  res.status(201).json(entry);
});

app.get('/api/budget/summary', async (req, res) => {
  const entries = await db.all('SELECT * FROM budget_entries WHERE user_id = ?', req.user.id);
  
  let expenses = 0;
  let savings = 0;
  
  entries.forEach(entry => {
    if (entry.type === 'Expense') expenses += entry.amount;
    else savings += entry.amount;
  });
  
  res.json({
    total_money: 5000,
    expenses,
    savings,
    remaining: 5000 - expenses - savings
  });
});

app.put('/api/budget/total-money', async (req, res) => {
  res.json({ total_money: req.body.total_money });
});

app.delete('/api/budget/entries/:id', async (req, res) => {
  await db.run('DELETE FROM budget_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.status(204).send();
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Initialize database and start server
async function start() {
  await initDatabase();
  
  // For Vercel, we need to export the app
  if (process.env.VERCEL) {
    console.log('Running on Vercel');
  } else {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

// Initialize for serverless
let initialized = false;
const handler = async (req, res) => {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
  return app(req, res);
};

// Export for Vercel
module.exports = handler;
