import authModule from './modules/auth.js';
import tasksModule from './modules/tasks.js';
import vaultModule from './modules/vault.js';
import budgetModule from './modules/budget.js';
import calendarModule from './modules/calendar.js';
import { Icons } from './utils/icons.js';

class App {
  constructor() {
    this.currentView = 'kanban';
    this.user = null;
    this.init();
  }
  
  async init() {
    await this.checkAuth();
    this.renderLoginScreen();
    this.bindEvents();
    this.loadTheme();
  }
  
  async checkAuth() {
    if (authModule.isAuthenticated()) {
      const user = await authModule.validate();
      if (user) {
        this.user = user;
        this.renderApp();
      } else {
        authModule.logout();
      }
    }
  }
  
  renderLoginScreen() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <h1>MyBoard</h1>
            <p>Enterprise Productivity Suite</p>
          </div>
          
          <div class="login-tabs">
            <button class="tab active" data-tab="login">Login</button>
            <button class="tab" data-tab="register">Register</button>
          </div>
          
          <form id="loginForm" class="login-form active">
            <input type="email" placeholder="Email" id="loginEmail" required>
            <input type="password" placeholder="Password" id="loginPassword" required>
            <button type="submit" class="btn-primary">Login</button>
            <button type="button" id="guestLoginBtn" class="btn-secondary">Continue as Guest</button>
          </form>
          
          <form id="registerForm" class="login-form">
            <input type="text" placeholder="Username" id="regUsername" required>
            <input type="email" placeholder="Email" id="regEmail" required>
            <input type="password" placeholder="Password" id="regPassword" required>
            <input type="password" placeholder="Confirm Password" id="regConfirmPassword" required>
            <button type="submit" class="btn-primary">Register</button>
          </form>
          
          <div id="loginError" class="error-message"></div>
        </div>
      </div>
    `;
    this.bindLoginEvents();
  }
  
  bindLoginEvents() {
    const tabs = document.querySelectorAll('.tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorDiv = document.getElementById('loginError');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.tab === 'login') {
          loginForm.classList.add('active');
          registerForm.classList.remove('active');
        } else {
          loginForm.classList.remove('active');
          registerForm.classList.add('active');
        }
      });
    });
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      try {
        const result = await authModule.login(email, password);
        this.user = result.user;
        this.renderApp();
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
    
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const confirm = document.getElementById('regConfirmPassword').value;
      if (password !== confirm) {
        errorDiv.textContent = 'Passwords do not match';
        return;
      }
      try {
        const result = await authModule.register(username, email, password);
        this.user = result.user;
        this.renderApp();
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
    
    document.getElementById('guestLoginBtn').addEventListener('click', async () => {
      try {
        const result = await authModule.guestLogin();
        this.user = result.user;
        this.renderApp();
      } catch (error) {
        errorDiv.textContent = error.message;
      }
    });
  }
  
  renderApp() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="app-container">
        <aside class="sidebar">
          <div class="sidebar-header">
            <h2>MyBoard</h2>
            <button id="themeToggle" class="icon-btn">${Icons.theme}</button>
          </div>
          
          <nav class="sidebar-nav">
            <button data-view="kanban" class="nav-btn active">
              ${Icons.kanban}
              <span>Kanban</span>
            </button>
            <button data-view="calendar" class="nav-btn">
              ${Icons.calendar}
              <span>Calendar</span>
            </button>
            <button data-view="vault" class="nav-btn">
              ${Icons.vault}
              <span>Vault</span>
            </button>
            <button data-view="budget" class="nav-btn">
              ${Icons.budget}
              <span>Budget</span>
            </button>
          </nav>
          
          <div class="sidebar-footer">
            <button id="exportDataBtn" class="icon-btn">${Icons.export}</button>
            <button id="importDataBtn" class="icon-btn">${Icons.import}</button>
            <button id="logoutBtn" class="icon-btn">${Icons.logout}</button>
          </div>
        </aside>
        
        <main class="main-content">
          <div id="kanbanView" class="view active">
            ${tasksModule.render()}
            <button id="fabAddTask" class="fab">${Icons.add}</button>
          </div>
          <div id="calendarView" class="view">
            ${calendarModule.render()}
          </div>
          <div id="vaultView" class="view">
            ${vaultModule.render()}
          </div>
          <div id="budgetView" class="view">
            ${budgetModule.render()}
          </div>
        </main>
      </div>
      
      <div id="taskModal" class="modal hidden">
        <div class="modal-content">
          <h3 id="modalTitle">New Task</h3>
          <input type="text" id="taskTitle" placeholder="Task title">
          <textarea id="taskDesc" placeholder="Description"></textarea>
          <input type="date" id="taskDate">
          <select id="taskPriority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
          <div class="modal-actions">
            <button id="saveTaskBtn" class="btn-primary">Save</button>
            <button id="closeModalBtn" class="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    this.bindAppEvents();
    this.loadData();
  }
  
  bindAppEvents() {
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchView(btn.dataset.view);
      });
    });
    
    document.getElementById('themeToggle').addEventListener('click', this.toggleTheme);
    document.getElementById('logoutBtn').addEventListener('click', () => {
      authModule.logout();
      this.renderLoginScreen();
    });
    document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
    document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
    document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeModal());
    document.getElementById('fabAddTask')?.addEventListener('click', () => this.openModal());
    
    tasksModule.init(this);
    calendarModule.init(this);
    vaultModule.init(this);
    budgetModule.init(this);
    
    // Listen for task updates to refresh calendar
    window.addEventListener('tasksUpdated', () => {
      calendarModule.refresh();
    });
  }
  
  switchView(view) {
    this.currentView = view;
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    if (view === 'calendar') calendarModule.refresh();
    if (view === 'vault') vaultModule.refresh();
    if (view === 'budget') budgetModule.refresh();
  }
  
  toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
  
  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.classList.add(savedTheme);
  }
  
  async loadData() {
    await tasksModule.load();
    await calendarModule.refresh();
    await vaultModule.load();
    await budgetModule.load();
  }
  
  async exportData() {
    const data = {
      tasks: await tasksModule.getAll(),
      vault: await vaultModule.getAll(),
      budget: await budgetModule.getAll()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myboard-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.tasks) await tasksModule.import(data.tasks);
      if (data.vault) await vaultModule.import(data.vault);
      if (data.budget) await budgetModule.import(data.budget);
      this.loadData();
      alert('Data imported successfully');
    };
    input.click();
  }
  
  openModal(task = null) {
    const modal = document.getElementById('taskModal');
    modal.classList.remove('hidden');
    if (task) {
      document.getElementById('modalTitle').textContent = 'Edit Task';
      document.getElementById('taskTitle').value = task.title;
      document.getElementById('taskDesc').value = task.description || '';
      document.getElementById('taskDate').value = task.due_date || '';
      document.getElementById('taskPriority').value = task.priority || 'medium';
      modal.dataset.taskId = task.id;
    } else {
      document.getElementById('modalTitle').textContent = 'New Task';
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskDesc').value = '';
      document.getElementById('taskDate').value = '';
      document.getElementById('taskPriority').value = 'medium';
      delete modal.dataset.taskId;
    }
  }
  
  closeModal() {
    document.getElementById('taskModal').classList.add('hidden');
  }
}

const app = new App();