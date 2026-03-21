import api from '../utils/api.js';

class CalendarModule {
  constructor() {
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.tasks = [];
    this.app = null;
  }
  
  init(app) {
    this.app = app;
    this.bindEvents();
  }
  
  render() {
    return `
      <div class="calendar-container">
        <div class="calendar-header">
          <div class="calendar-nav">
            <button class="calendar-nav-btn" id="prevMonthBtn">←</button>
            <button class="calendar-nav-btn" id="nextMonthBtn">→</button>
          </div>
          <h3 class="calendar-title" id="calendarTitle"></h3>
          <button class="calendar-nav-btn" id="todayBtn">Today</button>
        </div>
        
        <div class="unscheduled-section">
          <div class="unscheduled-title">Unscheduled Tasks</div>
          <div class="unscheduled-list" id="unscheduledList"></div>
        </div>
        
        <div class="calendar-grid" id="calendarGrid">
          <div class="calendar-weekday">Sun</div>
          <div class="calendar-weekday">Mon</div>
          <div class="calendar-weekday">Tue</div>
          <div class="calendar-weekday">Wed</div>
          <div class="calendar-weekday">Thu</div>
          <div class="calendar-weekday">Fri</div>
          <div class="calendar-weekday">Sat</div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
      this.currentMonth--;
      if (this.currentMonth < 0) {
        this.currentMonth = 11;
        this.currentYear--;
      }
      this.refresh();
    });
    
    document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
      this.currentMonth++;
      if (this.currentMonth > 11) {
        this.currentMonth = 0;
        this.currentYear++;
      }
      this.refresh();
    });
    
    document.getElementById('todayBtn')?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.currentMonth = this.currentDate.getMonth();
      this.currentYear = this.currentDate.getFullYear();
      this.refresh();
    });
  }
  
  async refresh() {
    await this.loadTasks();
    this.renderCalendar();
  }
  
  async loadTasks() {
    try {
      const startDate = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-01`;
      const endDate = new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().split('T')[0];
      
      const tasks = await api.get('/calendar/tasks', {
        year: this.currentYear,
        month: this.currentMonth + 1
      });
      
      this.tasks = tasks || [];
    } catch (error) {
      console.error('Failed to load calendar tasks:', error);
      this.tasks = [];
    }
  }
  
  renderCalendar() {
    const title = document.getElementById('calendarTitle');
    title.textContent = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
    
    // Render unscheduled tasks
    const unscheduledList = document.getElementById('unscheduledList');
    const unscheduledTasks = this.tasks.filter(t => !t.due_date);
    
    if (unscheduledTasks.length === 0) {
      unscheduledList.innerHTML = '<div class="empty-state">No unscheduled tasks</div>';
    } else {
      unscheduledList.innerHTML = unscheduledTasks.map(task => `
        <div class="unscheduled-task" data-id="${task.id}">
          ${this.escapeHtml(task.title)}
        </div>
      `).join('');
    }
    
    // Get first day of month
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    const existingDays = grid.querySelectorAll('.calendar-day');
    existingDays.forEach(day => day.remove());
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      grid.appendChild(emptyDay);
    }
    
    // Render days of month
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      
      const dayTasks = this.tasks.filter(t => t.due_date === dateStr);
      
      const dayDiv = document.createElement('div');
      dayDiv.className = `calendar-day ${isToday ? 'today' : ''}`;
      dayDiv.dataset.date = dateStr;
      
      dayDiv.innerHTML = `
        <div class="calendar-day-number">${day}</div>
        <div class="calendar-tasks">
          ${dayTasks.slice(0, 3).map(task => `
            <div class="calendar-task ${task.priority}" data-id="${task.id}">
              ${this.escapeHtml(task.title.substring(0, 20))}
            </div>
          `).join('')}
          ${dayTasks.length > 3 ? `<div class="calendar-task more">+${dayTasks.length - 3} more</div>` : ''}
        </div>
      `;
      
      dayDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.calendar-task')) {
          this.app.openModal({ due_date: dateStr });
        }
      });
      
      dayDiv.querySelectorAll('.calendar-task').forEach(taskEl => {
        taskEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const taskId = taskEl.dataset.id;
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            this.app.openModal(task);
          }
        });
      });
      
      grid.appendChild(dayDiv);
    }
    
    // Add click handlers for unscheduled tasks
    document.querySelectorAll('.unscheduled-task').forEach(taskEl => {
      taskEl.addEventListener('click', () => {
        const taskId = taskEl.dataset.id;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
          this.app.openModal(task);
        }
      });
    });
  }
  
  getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
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

export default new CalendarModule();