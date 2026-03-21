const db = require('../config/database');

class BudgetEntry {
  static async create({ userId, date, type, category, amount }) {
    const query = `
      INSERT INTO budget_entries (user_id, date, type, category, amount, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id, date, type, category, amount, created_at
    `;
    const result = await db.query(query, [userId, date, type, category, amount]);
    return result.rows[0];
  }
  
  static async findByUserId(userId, options = {}) {
    let query = 'SELECT * FROM budget_entries WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    if (options.startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }
    
    if (options.endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }
    
    query += ` ORDER BY date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(options.limit || 100, options.offset || 0);
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  static async delete(id, userId) {
    const query = 'DELETE FROM budget_entries WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(query, [id, userId]);
    return result.rows[0];
  }
  
  static async getTotalsByCategory(userId, startDate, endDate) {
    const query = `
      SELECT 
        category,
        SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN type = 'Savings' THEN amount ELSE 0 END) as savings
      FROM budget_entries
      WHERE user_id = $1
        AND date BETWEEN $2 AND $3
      GROUP BY category
      ORDER BY category
    `;
    const result = await db.query(query, [userId, startDate, endDate]);
    return result.rows;
  }
}

module.exports = BudgetEntry;