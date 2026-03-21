import api from '../utils/api.js';

class VaultModule {
  constructor() {
    this.entries = [];
    this.showForm = false;
  }
  
  init(app) {
    this.app = app;
    this.bindEvents();
  }
  
  render() {
    return `
      <div class="vault-container">
        <div class="vault-header">
          <h3 class="vault-title">Password Vault</h3>
          <button class="vault-add-btn" id="showVaultFormBtn">+ Add Entry</button>
        </div>
        
        <div id="vaultForm" class="vault-form" style="display: none;">
          <input type="text" id="vaultSite" placeholder="Site/Account Name" autocomplete="off">
          <input type="text" id="vaultUsername" placeholder="Username" autocomplete="off">
          <input type="password" id="vaultPassword" placeholder="Password">
          <button id="saveVaultBtn" class="btn-primary">Save</button>
          <button id="cancelVaultBtn" class="btn-secondary">Cancel</button>
        </div>
        
        <div class="vault-table-wrap">
          <table class="vault-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Username</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="vaultTableBody"></tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    document.getElementById('showVaultFormBtn')?.addEventListener('click', () => {
      this.showForm = !this.showForm;
      const form = document.getElementById('vaultForm');
      form.style.display = this.showForm ? 'flex' : 'none';
    });
    
    document.getElementById('saveVaultBtn')?.addEventListener('click', async () => {
      await this.saveEntry();
    });
    
    document.getElementById('cancelVaultBtn')?.addEventListener('click', () => {
      this.showForm = false;
      document.getElementById('vaultForm').style.display = 'none';
      this.clearForm();
    });
  }
  
  async load() {
    try {
      const entries = await api.get('/vault/entries');
      this.entries = entries || [];
      this.renderTable();
    } catch (error) {
      console.error('Failed to load vault entries:', error);
    }
  }
  
  renderTable() {
    const tbody = document.getElementById('vaultTableBody');
    if (!tbody) return;
    
    if (this.entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            <div class="empty-state-icon">🔐</div>
            <div class="empty-state-title">No vault entries</div>
            <div class="empty-state-description">Add your first password entry</div>
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = this.entries.map(entry => `
      <tr data-id="${entry.id}">
        <td>${this.escapeHtml(entry.site_name)}</td>
        <td>${this.escapeHtml(entry.username)}</td>
        <td>••••••••</td>
        <td class="vault-actions">
          <button class="vault-btn vault-btn-view" data-id="${entry.id}">View</button>
          <button class="vault-btn vault-btn-delete" data-id="${entry.id}">Delete</button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners
    tbody.querySelectorAll('.vault-btn-view').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await this.viewPassword(id);
      });
    });
    
    tbody.querySelectorAll('.vault-btn-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        await this.deleteEntry(id);
      });
    });
  }
  
  async saveEntry() {
    const site = document.getElementById('vaultSite').value.trim();
    const username = document.getElementById('vaultUsername').value.trim();
    const password = document.getElementById('vaultPassword').value;
    
    if (!site || !username || !password) {
      alert('All fields are required');
      return;
    }
    
    try {
      await api.post('/vault/entries', {
        site_name: site,
        username,
        password
      });
      
      await this.load();
      this.clearForm();
      this.showForm = false;
      document.getElementById('vaultForm').style.display = 'none';
    } catch (error) {
      console.error('Failed to save vault entry:', error);
      alert('Failed to save entry');
    }
  }
  
  async viewPassword(id) {
    try {
      const result = await api.get(`/vault/entries/${id}/decrypt`);
      const password = result.password;
      
      const copy = confirm(`Password: ${password}\n\nCopy to clipboard?`);
      if (copy) {
        await navigator.clipboard.writeText(password);
        alert('Password copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      alert('Failed to retrieve password');
    }
  }
  
  async deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await api.delete(`/vault/entries/${id}`);
      await this.load();
    } catch (error) {
      console.error('Failed to delete vault entry:', error);
      alert('Failed to delete entry');
    }
  }
  
  clearForm() {
    document.getElementById('vaultSite').value = '';
    document.getElementById('vaultUsername').value = '';
    document.getElementById('vaultPassword').value = '';
  }
  
  async getAll() {
    return this.entries;
  }
  
  async import(entries) {
    for (const entry of entries) {
      await api.post('/vault/entries', entry);
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

export default new VaultModule();