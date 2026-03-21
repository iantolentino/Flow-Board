const db = require('../config/database');

class VaultEntry {
  static async create({ userId, site_name, username, password_encrypted }) {
    const query = `
      INSERT INTO vault_entries (user_id, site_name, username, password_encrypted, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING id, user_id, site_name, username, created_at
    `;
    const result = await db.query(query, [userId, site_name, username, password_encrypted]);
    return result.rows[0];
  }
  
  static async findByUserId(userId) {
    const query = `
      SELECT id, site_name, username, created_at 
      FROM vault_entries 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [userId]);
    return result.rows;
  }
  
  static async findById(id, userId) {
    const query = `
      SELECT id, site_name, username, password_encrypted, created_at 
      FROM vault_entries 
      WHERE id = $1 AND user_id = $2
    `;
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }
  
  static async delete(id, userId) {
    const query = 'DELETE FROM vault_entries WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }
}

module.exports = VaultEntry;