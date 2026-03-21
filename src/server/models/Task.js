const db = require('../config/database');

class Task {
  static async create({ userId, title, description, dueDate, priority, status }) {
    const query = `
      INSERT INTO tasks (user_id, title, description, due_date, priority, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, user_id, title, description, due_date, priority, status, created_at, updated_at
    `;
    
    const values = [
      userId,
      title,
      description || null,
      dueDate || null,
      priority || 'medium',
      status || 'todo'
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  static async findByUserId(userId, options = {}) {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;
    
    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(options.limit || 50, options.offset || 0);
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  static async update(id, userId, updates) {
    const allowedFields = ['title', 'description', 'due_date', 'priority', 'status'];
    const setClauses = [];
    const params = [id, userId];
    let paramIndex = 3;
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${paramIndex}`);
        params.push(updates[field]);
        paramIndex++;
      }
    }
    
    if (setClauses.length === 0) return null;
    
    setClauses.push('updated_at = NOW()');
    const query = `
      UPDATE tasks 
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, title, description, due_date, priority, status, created_at, updated_at
    `;
    
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }
  
  static async delete(id, userId) {
    const query = 'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id';
    const result = await db.query(query, [id, userId]);
    return result.rows[0] || null;
  }
  
  static async getCalendarTasks(userId, startDate, endDate) {
    const query = `
      SELECT * FROM tasks 
      WHERE user_id = $1 
        AND due_date BETWEEN $2 AND $3
      ORDER BY due_date ASC, priority DESC
    `;
    const result = await db.query(query, [userId, startDate, endDate]);
    return result.rows;
  }
}

module.exports = Task;