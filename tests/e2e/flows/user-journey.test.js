const puppeteer = require('puppeteer');
const app = require('../../../src/server/app');

describe('User Journey E2E Tests', () => {
  let browser;
  let page;
  let server;

  beforeAll(async () => {
    server = app.listen(3002);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    await server.close();
  });

  describe('Complete User Workflow', () => {
    it('should login and create a task', async () => {
      // Navigate to app
      await page.goto('http://localhost:3002');
      
      // Wait for login form
      await page.waitForSelector('.login-card');
      
      // Fill login form
      await page.type('#loginEmail', 'test@example.com');
      await page.type('#loginPassword', 'password123');
      
      // Submit login
      await page.click('#loginForm button[type="submit"]');
      
      // Wait for dashboard to load
      await page.waitForSelector('.kanban-board');
      
      // Click add task button
      await page.click('#addTaskBtn');
      
      // Wait for modal
      await page.waitForSelector('#taskModal');
      
      // Fill task form
      await page.type('#taskTitle', 'E2E Test Task');
      await page.type('#taskDesc', 'Created by automated test');
      await page.select('#taskPriority', 'high');
      
      // Save task
      await page.click('#saveTaskBtn');
      
      // Wait for task to appear
      await page.waitForSelector('.task-card');
      
      // Verify task is created
      const taskTitle = await page.$eval('.task-title', el => el.textContent);
      expect(taskTitle).toContain('E2E Test Task');
    });

    it('should move task between columns', async () => {
      // Get task element
      const task = await page.$('.task-card');
      const taskBounds = await task.boundingBox();
      
      // Get target column
      const targetColumn = await page.$('.kanban-column[data-status="inprogress"] .task-list');
      const targetBounds = await targetColumn.boundingBox();
      
      // Drag and drop
      await page.mouse.move(taskBounds.x + taskBounds.width / 2, taskBounds.y + taskBounds.height / 2);
      await page.mouse.down();
      await page.mouse.move(targetBounds.x + targetBounds.width / 2, targetBounds.y + targetBounds.height / 2);
      await page.mouse.up();
      
      // Wait for update
      await page.waitForTimeout(1000);
      
      // Verify task moved
      const inprogressTasks = await page.$$('.kanban-column[data-status="inprogress"] .task-card');
      expect(inprogressTasks.length).toBeGreaterThan(0);
    });

    it('should add vault entry', async () => {
      // Switch to vault view
      await page.click('[data-view="vault"]');
      
      // Wait for vault to load
      await page.waitForSelector('.vault-container');
      
      // Click add button
      await page.click('#showVaultFormBtn');
      
      // Fill vault form
      await page.type('#vaultSite', 'Test Site');
      await page.type('#vaultUsername', 'testuser');
      await page.type('#vaultPassword', 'testpass123');
      
      // Save entry
      await page.click('#saveVaultBtn');
      
      // Wait for entry to appear
      await page.waitForSelector('.vault-table tbody tr');
      
      // Verify entry
      const siteName = await page.$eval('.vault-table tbody tr td:first-child', el => el.textContent);
      expect(siteName).toContain('Test Site');
    });

    it('should add budget entry', async () => {
      // Switch to budget view
      await page.click('[data-view="budget"]');
      
      // Wait for budget to load
      await page.waitForSelector('.budget-container');
      
      // Set total money
      await page.type('#totalMoneyInput', '5000');
      await page.click('#setTotalMoneyBtn');
      
      // Add expense
      await page.type('#budgetDate', '2024-01-15');
      await page.select('#budgetType', 'Expense');
      await page.select('#budgetCategory', 'Food');
      await page.type('#budgetAmount', '45.50');
      await page.click('#addBudgetBtn');
      
      // Wait for entry to appear
      await page.waitForSelector('.budget-table tbody tr');
      
      // Verify expense added
      const amount = await page.$eval('.budget-table tbody tr td:nth-child(4)', el => el.textContent);
      expect(amount).toContain('45.50');
    });

    it('should export data', async () => {
      // Click export button
      const downloadPromise = page.waitForEvent('download');
      await page.click('#exportDataBtn');
      const download = await downloadPromise;
      
      expect(download).toBeDefined();
    });

    it('should logout', async () => {
      // Click logout button
      await page.click('#logoutBtn');
      
      // Verify redirected to login
      await page.waitForSelector('.login-card');
      const loginForm = await page.$('#loginForm');
      expect(loginForm).toBeTruthy();
    });
  });
});