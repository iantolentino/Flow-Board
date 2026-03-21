const validator = require('express-validator');

const validateRegistration = (data) => {
  const errors = [];
  
  if (!data.username || data.username.length < 3 || data.username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = [];
  
  if (!data.email) {
    errors.push('Email is required');
  }
  
  if (!data.password) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateTask = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Task title is required');
  }
  
  if (data.title && data.title.length > 200) {
    errors.push('Task title must be less than 200 characters');
  }
  
  const validPriorities = ['low', 'medium', 'high'];
  if (data.priority && !validPriorities.includes(data.priority)) {
    errors.push('Invalid priority value');
  }
  
  const validStatuses = ['todo', 'inprogress', 'done'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push('Invalid status value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateVaultEntry = (data) => {
  const errors = [];
  
  if (!data.site_name || data.site_name.trim().length === 0) {
    errors.push('Site name is required');
  }
  
  if (!data.username || data.username.trim().length === 0) {
    errors.push('Username is required');
  }
  
  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBudgetEntry = (data) => {
  const errors = [];
  
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Valid date is required (YYYY-MM-DD)');
  }
  
  if (!data.type || !['Expense', 'Savings'].includes(data.type)) {
    errors.push('Type must be either Expense or Savings');
  }
  
  if (!data.category || data.category.trim().length === 0) {
    errors.push('Category is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateTask,
  validateVaultEntry,
  validateBudgetEntry
};