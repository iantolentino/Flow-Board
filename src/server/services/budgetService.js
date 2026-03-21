const BudgetEntry = require('../models/BudgetEntry');
const BudgetTotal = require('../models/BudgetTotal');
const ExcelJS = require('exceljs');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

class BudgetService {
  async getUserEntries(userId, options) {
    return await BudgetEntry.findByUserId(userId, options);
  }
  
  async addEntry(entryData) {
    const entry = await BudgetEntry.create(entryData);
    return entry;
  }
  
  async getSummary(userId) {
    const entries = await BudgetEntry.findByUserId(userId, { limit: 10000 });
    const totalMoney = await BudgetTotal.getTotal(userId);
    
    let expenses = 0;
    let savings = 0;
    
    for (const entry of entries) {
      if (entry.type === 'Expense') {
        expenses += parseFloat(entry.amount);
      } else {
        savings += parseFloat(entry.amount);
      }
    }
    
    const remaining = parseFloat(totalMoney) - expenses - savings;
    
    return {
      total_money: parseFloat(totalMoney),
      expenses,
      savings,
      remaining
    };
  }
  
  async updateTotalMoney(userId, amount) {
    return await BudgetTotal.setTotal(userId, amount);
  }
  
  async deleteEntry(entryId, userId) {
    return await BudgetEntry.delete(entryId, userId);
  }
  
  async exportToExcel(userId) {
    const entries = await BudgetEntry.findByUserId(userId, { limit: 10000 });
    const summary = await this.getSummary(userId);
    
    const workbook = new ExcelJS.Workbook();
    
    // Entries sheet
    const entriesSheet = workbook.addWorksheet('Entries');
    entriesSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Amount', key: 'amount', width: 12 }
    ];
    
    entries.forEach(entry => {
      entriesSheet.addRow({
        date: entry.date,
        type: entry.type,
        category: entry.category,
        amount: parseFloat(entry.amount)
      });
    });
    
    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Metric', 'Amount']);
    summarySheet.addRow(['Total Money', summary.total_money]);
    summarySheet.addRow(['Total Expenses', summary.expenses]);
    summarySheet.addRow(['Total Savings', summary.savings]);
    summarySheet.addRow(['Remaining', summary.remaining]);
    
    // Category breakdown
    const categories = {};
    for (const entry of entries) {
      if (!categories[entry.category]) {
        categories[entry.category] = { expenses: 0, savings: 0 };
      }
      if (entry.type === 'Expense') {
        categories[entry.category].expenses += parseFloat(entry.amount);
      } else {
        categories[entry.category].savings += parseFloat(entry.amount);
      }
    }
    
    const categorySheet = workbook.addWorksheet('By Category');
    categorySheet.columns = [
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Expenses', key: 'expenses', width: 12 },
      { header: 'Savings', key: 'savings', width: 12 }
    ];
    
    for (const [cat, data] of Object.entries(categories)) {
      categorySheet.addRow({
        category: cat,
        expenses: data.expenses,
        savings: data.savings
      });
    }
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

module.exports = new BudgetService();