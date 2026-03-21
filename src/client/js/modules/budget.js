import api from '../utils/api.js';

class BudgetModule {
  constructor() {
    this.entries = [];
    this.summary = {
      total_money: 0,
      expenses: 0,
      savings: 0,
      remaining: 0
    };
  }
  
  init(app) {
    this.app = app;
    this.bindEvents();
  }
  
  render() {
    return `
      <div class="budget-container">
        <div class="budget-stats">
          <div class="stat-card">
            <div class="stat-label">Total Money</div>
            <div class="stat-value" id="totalMoney">₱0.00</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Expenses</div>
            <div class="stat-value negative" id="totalExpenses">₱0.00</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Savings</div>
            <div class="stat-value positive" id="totalSavings">₱0.00</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Remaining</div>
            <div class="stat-value" id="remainingMoney">₱0.00</div>
          </div>
        </div>
        
        <div class="budget-actions">
          <div class="budget-form-group">
            <label>Total Money</label>
            <input type="number" id="totalMoneyInput" placeholder="Enter total money" step="0.01">
          </div>
          <button id="setTotalMoneyBtn" class="btn-primary">Set Total</button>
          <button id="exportExcelBtn" class="btn-secondary">Export Excel</button>
        </div>
        
        <div class="budget-form">
          <div class="budget-form-group">
            <label>Date</label>
            <input type="date" id="budgetDate">
          </div>
          <div class="budget-form-group">
            <label>Type</label>
            <select id="budgetType">
              <option value="Expense">Expense</option>
              <option value="Savings">Savings</option>
            </select>
          </div>
          <div class="budget-form-group">
            <label>Category</label>
            <select id="budgetCategory">
              <option>Food</option>
              <option>Transport</option>
              <option>Bills</option>
              <option>Leisure</option>
              <option>Other</option>
            </select>
          </div>
          <div class="budget-form-group">
            <label>Amount</label>
            <input type="number" id="budgetAmount" placeholder="Amount" step="0.01">
          </div>
          <button id="addBudgetBtn" class="btn-primary">Add Entry</button>
        </div>
        
        <div class="budget-table-wrap">
          <table class="budget-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="budgetTableBody"></tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    document.getElementById('setTotalMoneyBtn')?.addEventListener('click', async () => {
      await this.setTotalMoney();
    });
    
    document.getElementById('addBudgetBtn')?.addEventListener('click', async () => {
      await this.addEntry();
    });
    
    document.getElementById('exportExcelBtn')?.addEventListener('click', async () => {
      await this.exportExcel();
    });
  }
  
  async load() {
    try {
      await Promise.all([
        this.loadEntries(),
        this.loadSummary()
      ]);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    }
  }
  
  async loadEntries() {
    try {
      const response = await api.get('/budget/entries');
      this.entries = response.entries || [];
      this.renderTable();
    } catch (error) {
      console.error('Failed to load budget entries:', error);
    }
  }
  
  async loadSummary() {
    try {
      this.summary = await api.get('/budget/summary');
      this.updateStats();
    } catch (error) {
      console.error('Failed to load budget summary:', error);
    }
  }
  
  updateStats() {
    const currency = '₱';
    document.getElementById('totalMoney').textContent = `${currency}${this.summary.total_money.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `${currency}${this.summary.expenses.toFixed(2)}`;
    document.getElementById('totalSavings').textContent = `${currency}${this.summary.savings.toFixed(2)}`;
    document.getElementById('remainingMoney').textContent = `${currency}${this.summary.remaining.toFixed(2)}`;
  }
  
  renderTable() {
    const tbody = document.getElementById('budgetTableBody');
    if (!tbody) return;
    
    if (this.entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <div class="empty-state-icon">💰</div>
            <div class="empty-state-title">No budget entries</div>
            <div class="empty-state-description">Add your first expense or savings entry</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.entries.map(entry => `
      <tr data-id="${entry.id}">
        <td>${entry.date}</td>
        <td><span class="budget-type ${entry.type.toLowerCase()}">${entry.type}</span></td>
        <td>${this.escapeHtml(entry.category)}</td>
        <td>₱${parseFloat(entry.amount).toFixed(2)}</td>
        <td>
          <button class="vault-btn vault-btn-delete" data-id="${entry.id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
    tbody.querySelectorAll('.vault-btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await this.deleteEntry(id);
      });
    });
  }
  
  async setTotalMoney() {
    const input = document.getElementById('totalMoneyInput');
    const amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      await api.put('/budget/total-money', { total_money: amount });
      await this.loadSummary();
      input.value = '';
    } catch (error) {
      console.error('Failed to set total money:', error);
      alert('Failed to update total money');
    }
  }
  
  async addEntry() {
    const date = document.getElementById('budgetDate').value;
    const type = document.getElementById('budgetType').value;
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    if (!date) {
      alert('Please select a date');
      return;
    }
    
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    
    try {
      await api.post('/budget/entries', { date, type, category, amount });
      await this.load();
      this.clearForm();
    } catch (error) {
      console.error('Failed to add budget entry:', error);
      alert('Failed to add entry');
    }
  }
  
  async deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await api.delete(`/budget/entries/${id}`);
      await this.load();
    } catch (error) {
      console.error('Failed to delete budget entry:', error);
      alert('Failed to delete entry');
    }
  }
  
  async exportExcel() {
    try {
      const response = await fetch('/api/budget/export/excel', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-export-${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Excel:', error);
      alert('Failed to export Excel file');
    }
  }
  
  clearForm() {
    document.getElementById('budgetDate').value = '';
    document.getElementById('budgetType').value = 'Expense';
    document.getElementById('budgetCategory').value = 'Food';
    document.getElementById('budgetAmount').value = '';
  }
  
  async getAll() {
    return this.entries;
  }
  
  async import(entries) {
    for (const entry of entries) {
      await api.post('/budget/entries', entry);
    }
    await this.load();
  }
  
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

export default new BudgetModule();