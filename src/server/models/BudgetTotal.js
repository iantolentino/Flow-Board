const db = require('../config/database');

class BudgetTotal {
  static async getTotal(userId) {
    const query = 'SELECT total_money FROM budget_totals WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    if (result.rows.length === 0) {
      return 0;
    }
    return parseFloat(result.rows[0].total_money);
  }
  
  static async setTotal(userId, amount) {
    const query = `
      INSERT INTO budget_totals (user_id, total_money, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET total_money = $2, updated_at = NOW()
      RETURNING user_id, total_money, updated_at
    `;
    const result = await db.query(query, [userId, amount]);
    return result.rows[0];
  }
}

module.exports = BudgetTotal;