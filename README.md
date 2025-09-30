# ⚡ MyBoard — Kanban + Calendar + Vault + Budget

**MyBoard** is a lightweight, browser-based productivity workspace that combines:

* 📋 **Kanban Board** for task management
* 🗓 **Calendar** view with scheduled & unscheduled tasks
* 🔐 **Password Vault** for storing login credentials
* 💰 **Budget Tracker** (embedded in iframe)

All data is stored in **localStorage/JSON export**, so no backend is required.

---

## ✨ Features

* **Kanban Board**: Drag & drop tasks between *To Do*, *In Progress*, and *Done*.
* **Calendar View**: Navigate months, display due dates, and list unscheduled tasks.
* **Password Vault**: Save account credentials (Account, Username, Password) with add/remove actions.
* **Budget Tracker Integration**: Launches a built-in budget tracker via iframe (`budget.html`).
* **Export/Import JSON**: Backup and restore your data.
* **Theme Toggle**: Switch between 🌙 dark and ☀️ light modes.

---

## 📂 Project Structure

```
MyBoard/
├── index.html       # Main application
├── script.js        # Core logic (tasks, vault, calendar)
├── style.css        # UI design + responsive layout
├── budget.html      # Embedded Budget Tracker
```

---

## 🛠 Requirements

* Runs in any modern browser (Chrome, Edge, Firefox).
* No external server or database needed.

---

## ▶️ Usage

1. Open `index.html` in your browser.
2. Use the **sidebar** to switch between:

   * Kanban Board
   * Calendar
   * Password Vault
   * Budget Tracker
3. Add tasks via ➕ **Add Task** button.
4. Export JSON for backup, Import JSON to restore.
5. Manage vault entries in the **Password Vault** tab.

---

## 🎨 Design & Accessibility

* Clean, minimal design with **light/dark theme toggle**.
* ARIA labels for accessibility (Kanban lists, Calendar grid, Vault table).
* Responsive layout works on desktop and tablet.

---

## 📸 Example Workflow

1. Add a new task → set due date + priority.
2. View tasks in **Kanban Board** or by month in **Calendar**.
3. Save important credentials in the **Vault**.
4. Track expenses/savings in **Budget Tracker**.
5. Export all data as JSON for safe backup.

---

## 📜 License

MIT License — free for personal and professional use.
