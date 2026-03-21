const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');
const env = require('./environment');

class DatabaseConnection {
  constructor() {
    this.db = null;
    this.isSqlite = env.get('USE_SQLITE') === 'true';
    this.init();
  }

  async init() {
    if (this.isSqlite) {
      await this.initSqlite();
    } else {
      await this.initPostgres();
    }
  }

  async initSqlite() {
    const dbPath = env.get('DATABASE_PATH', './data/myboard.db');
    const dbDir = path.dirname(dbPath);
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('SQLite database connected:', dbPath);
    await this.runMigrations();
  }

  async initPostgres() {
    this.pool = new Pool({
      connectionString: env.get('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    console.log('PostgreSQL database connected');
    await this.runMigrations();
  }

  async runMigrations() {
    if (this.isSqlite) {
      await this.runSqliteMigrations();
    } else {
      await this.runPostgresMigrations();
    }
  }

  async runSqliteMigrations() {
    const migrations = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT,
        is_guest BOOLEAN DEFAULT 0,
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
      )`
    ];
    
    for (const sql of migrations) {
      await this.db.exec(sql);
    }
    console.log('SQLite migrations completed');
  }

  async runPostgresMigrations() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) UNIQUE,
          password_hash VARCHAR(255),
          is_guest BOOLEAN DEFAULT FALSE,
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          due_date DATE,
          priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
          status VARCHAR(20) CHECK (status IN ('todo', 'inprogress', 'done')),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS vault_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          site_name VARCHAR(200) NOT NULL,
          username VARCHAR(200) NOT NULL,
          password_encrypted JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS budget_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          type VARCHAR(20) CHECK (type IN ('Expense', 'Savings')),
          category VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS budget_totals (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          total_money DECIMAL(10,2) DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      console.log('PostgreSQL migrations completed');
    } finally {
      client.release();
    }
  }

  async query(sql, params = []) {
    if (this.isSqlite) {
      return this.db.all(sql, params);
    } else {
      const result = await this.pool.query(sql, params);
      return result.rows;
    }
  }

  async queryOne(sql, params = []) {
    const results = await this.query(sql, params);
    return results[0];
  }

  async execute(sql, params = []) {
    if (this.isSqlite) {
      return this.db.run(sql, params);
    } else {
      return this.pool.query(sql, params);
    }
  }

  async end() {
    if (this.isSqlite) {
      await this.db.close();
    } else {
      await this.pool.end();
    }
  }
}

module.exports = new DatabaseConnection();