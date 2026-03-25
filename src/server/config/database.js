const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.pool = null;
    // On Vercel, always use SQLite with /tmp directory
    this.isSqlite = true;
  }

  async init() {
    if (this.isSqlite) {
      await this.initSqlite();
    } else {
      await this.initPostgres();
    }
    await this.runMigrations();
    return this;
  }

  async initSqlite() {
    // Use /tmp on Vercel, local data folder otherwise
    let dbPath;
    if (process.env.VERCEL) {
      dbPath = '/tmp/myboard.db';
      console.log('Running on Vercel, using /tmp/myboard.db');
    } else {
      dbPath = path.join(__dirname, '../../../data/myboard.db');
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      console.log('Local development, using:', dbPath);
    }
    
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('✅ SQLite database connected');
  }

  async runMigrations() {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_guest INTEGER DEFAULT 0,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date DATE,
        priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
        status TEXT CHECK(status IN ('todo', 'inprogress', 'done')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS vault_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        username TEXT NOT NULL,
        password_encrypted TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS budget_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        type TEXT CHECK(type IN ('Expense', 'Savings')),
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS budget_totals (
        user_id TEXT PRIMARY KEY,
        total_money REAL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
      `CREATE INDEX IF NOT EXISTS idx_vault_entries_user_id ON vault_entries(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_budget_entries_user_id ON budget_entries(user_id)`
    ];
    
    for (const sql of migrations) {
      await this.db.exec(sql);
    }
    console.log('✅ Migrations completed');
  }

  async query(sql, params = []) {
    return this.db.all(sql, params);
  }

  async queryOne(sql, params = []) {
    const results = await this.query(sql, params);
    return results[0];
  }

  async execute(sql, params = []) {
    return this.db.run(sql, params);
  }

  async end() {
    if (this.db) {
      await this.db.close();
    }
  }
}

module.exports = new DatabaseConnection();
