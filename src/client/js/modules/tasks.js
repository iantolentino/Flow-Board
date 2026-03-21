import api from '../utils/api.js';

class TasksModule {
  constructor() {
    this.tasks = [];
    this.app = null;
  }
  
  init(app) {
    this.app = app;
    this.bindEvents();
  }
  
  render() {
    return `
      <div class="kanban-board">
        <div class="kanban-column" data-status="todo">
          <div class="column-header">
            <h3>To Do</h3>
            <span class="column-count" id="todoCount">0</span>
          </div>
          <div class="task-list" id="todoList"></div>
        </div>
        
        <div class="kanban-column" data-status="inprogress">
          <div class="column-header">
            <h3>In Progress</h3>
            <span class="column-count" id="inprogressCount">0</span>
          </div>
          <div class="task-list" id="inprogressList"></div>
        </div>
        
        <div class="kanban-column" data-status="done">
          <div class="column-header">
            <h3>Done</h3>
            <span class="column-count" id="doneCount">0</span>
          </div>
          <div class="task-list" id="doneList"></div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.task-card')) {
        const taskId = e.target.closest('.task-card').dataset.id;
        if (e.target.closest('.task-delete')) {
          await this.deleteTask(taskId);
        } else if (e.target.closest('.task-edit')) {
          const task = this.tasks.find(t => t.id === taskId);
          this.app.openModal(task);
        } else {
          // View task details
          this.viewTask(taskId);
        }
      }
    });
    
    document.getElementById('saveTaskBtn')?.addEventListener('click', async () => {
      await this.saveTask();
    });
    
    this.setupDragAndDrop();
  }
  
async load() {
        try {
            const response = await api.get('/tasks');
            this.tasks = response.tasks || [];
            this.renderTasks();
            window.dispatchEvent(new CustomEvent('tasksUpdated')); // ADD THIS LINE
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }
    
  renderTasks() {
    const statuses = ['todo', 'inprogress', 'done'];
    
    statuses.forEach(status => {
      const container = document.getElementById(`${status}List`);
      const countSpan = document.getElementById(`${status}Count`);
      
      if (!container) return;
      
      const statusTasks = this.tasks.filter(t => t.status === status);
      countSpan.textContent = statusTasks.length;
      
      container.innerHTML = statusTasks.map(task => this.renderTaskCard(task)).join('');
    });
  }
  
  renderTaskCard(task) {
    return `
      <div class="task-card priority-${task.priority}" data-id="${task.id}" draggable="true">
        <div class="task-title">${this.escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${task.due_date ? `<span class="task-date">📅 ${task.due_date}</span>` : ''}
          <span class="task-priority-badge ${task.priority}">${task.priority}</span>
        </div>
        <div class="task-actions">
          <button class="task-action-btn task-edit" title="Edit">✏️</button>
          <button class="task-action-btn task-delete" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }
  
  async saveTask() {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDesc').value;
    const dueDate = document.getElementById('taskDate').value;
    const priority = document.getElementById('taskPriority').value;
    const taskId = document.getElementById('taskModal').dataset.taskId;
    
    if (!title) {
      alert('Task title is required');
      return;
    }
    
    const taskData = { title, description, due_date: dueDate, priority };
    
    try {
      if (taskId) {
        await api.put(`/tasks/${taskId}`, taskData);
      } else {
        await api.post('/tasks', { ...taskData, status: 'todo' });
      }
      
      await this.load();
      this.app.closeModal();
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task');
    }
  }
  
  async deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await api.delete(`/tasks/${taskId}`);
      await this.load();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  }
  
  async updateTaskStatus(taskId, status) {
    try {
      await api.put(`/tasks/${taskId}`, { status });
      await this.load();
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  }
  
  setupDragAndDrop() {
    document.addEventListener('dragstart', (e) => {
      if (e.target.closest('.task-card')) {
        const task = e.target.closest('.task-card');
        e.dataTransfer.setData('text/plain', task.dataset.id);
        task.classList.add('dragging');
      }
    });
    
    document.addEventListener('dragend', (e) => {
      if (e.target.closest('.task-card')) {
        e.target.closest('.task-card').classList.remove('dragging');
      }
    });
    
    document.addEventListener('dragover', (e) => {
      if (e.target.closest('.task-list')) {
        e.preventDefault();
      }
    });
    
    document.addEventListener('drop', async (e) => {
      const taskList = e.target.closest('.task-list');
      if (!taskList) return;
      
      const taskId = e.dataTransfer.getData('text/plain');
      const column = taskList.closest('.kanban-column');
      const newStatus = column.dataset.status;
      
      if (taskId && newStatus) {
        await this.updateTaskStatus(taskId, newStatus);
      }
    });
  }
  
  viewTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      alert(`Task: ${task.title}\nDescription: ${task.description || 'No description'}\nDue: ${task.due_date || 'No due date'}\nPriority: ${task.priority}`);
    }
  }
  
  async getAll() {
    return this.tasks;
  }
  
  async import(tasks) {
    for (const task of tasks) {
      await api.post('/tasks', task);
    }
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

export default new TasksModule();