const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  static async create({ username, email, password }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const query = `
      INSERT INTO users (username, email, password_hash, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, username, email, created_at
    `;
    const result = await db.query(query, [username, email, hashedPassword]);
    return result.rows[0];
  }
  
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }
  
  static async findById(id) {
    const query = 'SELECT id, username, email, created_at, last_login FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
  
  static async validatePassword(user, password) {
    return await bcrypt.compare(password, user.password_hash);
  }
  
  static async updateLastLogin(id) {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = $1';
    await db.query(query, [id]);
  }
}

module.exports = User;