/* script.js - complete */

/* -------------------- App State -------------------- */
let tasks = JSON.parse(localStorage.getItem("kanbanTasks")) || [];
let vaultEntries = JSON.parse(localStorage.getItem("vault_entries")) || [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

/* -------------------- Utilities -------------------- */
function saveTasksToLocal() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}
function saveVaultToLocal() {
  localStorage.setItem("vault_entries", JSON.stringify(vaultEntries));
}
function downloadObjectAsJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* -------------------- Helpers -------------------- */
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* -------------------- Modal (Add/Edit Task) -------------------- */
function openModal(date = "") {
  const modal = document.getElementById("taskModal");
  modal.classList.remove("hidden");
  const inputDate = document.getElementById("taskDate");
  inputDate.value = date || "";
  setTimeout(() => document.getElementById("taskTitle").focus(), 50);
}
function closeModal() {
  const modal = document.getElementById("taskModal");
  modal.classList.add("hidden");
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskPriority").value = "medium";
}

/* -------------------- Kanban (add, render, drag/drop) -------------------- */
function saveTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const dueDate = document.getElementById("taskDate").value;
  const priority = document.getElementById("taskPriority").value || "medium";
  if (!title) { alert("Title required"); return; }
  const t = { id: Date.now(), title, desc, dueDate, priority, status: "todo" };
  tasks.push(t);
  saveTasksToLocal();
  renderTasks();
  renderCalendar();
  closeModal();
}

function renderTasks() {
  ["todo", "inprogress", "done"].forEach(status => {
    const container = document.getElementById(status);
    if (!container) return;
    container.innerHTML = "";
    tasks.filter(t => t.status === status).forEach(t => {
      const div = document.createElement("div");
      div.className = "task";
      div.draggable = true;
      div.dataset.id = t.id;

      // border-left color by status
      div.style.borderLeft = "6px solid " +
        (t.status === "todo" ? "#9CA3AF" : t.status === "inprogress" ? "#f59e0b" : "#10b981");

      div.innerHTML = `
        <h4>${escapeHtml(t.title)}</h4>
        <div class="desc">${escapeHtml(t.desc || "")}</div>
        <div class="meta">
          <span class="priority ${t.priority}">${t.priority.toUpperCase()}</span>
          <span>📅 ${t.dueDate || "N/A"}</span>
        </div>
      `;

      // edit on dblclick (title)
      div.addEventListener("dblclick", () => {
        const newTitle = prompt("Edit title", t.title);
        if (newTitle !== null) {
          t.title = newTitle.trim() || t.title;
          saveTasksToLocal();
          renderTasks();
          renderCalendar();
        }
      });

      addDragEvents(div);
      container.appendChild(div);
    });
  });
}

/* drag helpers */
function addDragEvents(el) {
  el.addEventListener("dragstart", e => e.target.classList.add("dragging"));
  el.addEventListener("dragend", e => e.target.classList.remove("dragging"));
}

/* attach droppable behavior to columns */
function setupColumnDrop() {
  document.querySelectorAll(".task-list").forEach(list => {
    list.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      if (dragging && list !== dragging.parentElement) {
        list.appendChild(dragging);
      }
    });
    list.addEventListener("drop", e => {
      e.preventDefault();
      const dragging = document.querySelector(".dragging");
      if (dragging) {
        const id = parseInt(dragging.dataset.id);
        const status = list.id;
        const task = tasks.find(x => x.id === id);
        if (task) {
          task.status = status;
          saveTasksToLocal();
          renderTasks();
          renderCalendar();
        }
      }
    });
  });
}

/* -------------------- Calendar -------------------- */
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const title = document.getElementById("calendarTitle");
  title.textContent = `${new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // fill blanks
  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayCell = document.createElement("div");
    dayCell.className = "day";
    const strong = document.createElement("strong");
    strong.textContent = d;
    dayCell.appendChild(strong);

    // highlight today
    const today = new Date();
    if (today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
      dayCell.classList.add("today");
    }

    // tasks on this date
    const dayTasks = tasks.filter(t => t.dueDate === dateStr);
    dayTasks.slice(0, 3).forEach(t => {
      const b = document.createElement("div");
      // priority class shows gradient color
      b.className = `day-task ${t.priority}`;
      b.textContent = t.title.length > 20 ? t.title.slice(0, 17) + "..." : t.title;
      // clicking the mini-task allows quick edit of title
      b.addEventListener("click", ev => {
        ev.stopPropagation();
        const newTitle = prompt("Edit task title", t.title);
        if (newTitle !== null) {
          t.title = newTitle;
          saveTasksToLocal();
          renderTasks();
          renderCalendar();
        }
      });
      dayCell.appendChild(b);
    });

    if (dayTasks.length > 3) {
      const more = document.createElement("div");
      more.style.fontSize = ".75rem";
      more.style.color = "var(--muted)";
      more.textContent = `+${dayTasks.length - 3} more`;
      dayCell.appendChild(more);
    }

    // click a day to create task on that date
    dayCell.addEventListener("click", () => openModal(dateStr));

    grid.appendChild(dayCell);
  }
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

/* -------------------- Views (show/hide) -------------------- */
function showKanban() {
  document.getElementById("kanbanView").style.display = "flex";
  document.getElementById("calendarView").style.display = "none";
  document.getElementById("vaultView").style.display = "none";
  document.getElementById("budgetView").style.display = "none";
  document.getElementById("viewTitle").textContent = "Kanban Board";
}
function showCalendar() {
  document.getElementById("kanbanView").style.display = "none";
  document.getElementById("calendarView").style.display = "block";
  document.getElementById("vaultView").style.display = "none";
  document.getElementById("budgetView").style.display = "none";
  document.getElementById("viewTitle").textContent = "Calendar";
  renderCalendar();
}
function showVault() {
  document.getElementById("kanbanView").style.display = "none";
  document.getElementById("calendarView").style.display = "none";
  document.getElementById("vaultView").style.display = "block";
  document.getElementById("budgetView").style.display = "none";
  document.getElementById("viewTitle").textContent = "Password Vault";
  renderVaultTable();
}
function showBudget() {
  document.getElementById("kanbanView").style.display = "none";
  document.getElementById("calendarView").style.display = "none";
  document.getElementById("vaultView").style.display = "none";
  document.getElementById("budgetView").style.display = "block";
  document.getElementById("viewTitle").textContent = "Budget Tracker";
  // nothing else needed here; iframe handles budget UI
}

/* -------------------- Vault (add/view/delete/render) -------------------- */
function addVaultEntry() {
  const name = document.getElementById("vaultName").value.trim();
  const user = document.getElementById("vaultUser").value.trim();
  const pass = document.getElementById("vaultPass").value;
  if (!name || !user || !pass) { alert("All vault fields required"); return; }
  vaultEntries.push({ id: Date.now(), site: name, username: user, password: pass });
  saveVaultToLocal();
  document.getElementById("vaultName").value = "";
  document.getElementById("vaultUser").value = "";
  document.getElementById("vaultPass").value = "";
  renderVaultTable();
}

function renderVaultTable() {
  const tbody = document.getElementById("vaultTable");
  if (!tbody) return;
  tbody.innerHTML = "";
  vaultEntries.forEach(e => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(e.site)}</td>
      <td>${escapeHtml(e.username)}</td>
      <td>••••••••</td>
      <td>
        <button class="view-btn">View</button>
        <button class="delete-btn">Delete</button>
      </td>
    `;
    // wire up buttons explicitly to avoid inline onclick issues
    const viewBtn = tr.querySelector(".view-btn");
    viewBtn.addEventListener("click", () => vaultView(e.id));
    const delBtn = tr.querySelector(".delete-btn");
    delBtn.addEventListener("click", () => vaultDelete(e.id));
    tbody.appendChild(tr);
  });
}

function vaultView(id) {
  const found = vaultEntries.find(x => x.id === id);
  if (!found) return;
  // Show and optionally copy to clipboard
  const show = confirm(`Account: ${found.site}\nUser: ${found.username}\n\nShow password?`);
  if (show) {
    // show in alert and copy to clipboard if available
    alert(`Password: ${found.password}`);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(found.password).catch(() => {});
    }
  }
}

function vaultDelete(id) {
  if (!confirm("Delete this vault entry?")) return;
  vaultEntries = vaultEntries.filter(x => x.id !== id);
  saveVaultToLocal();
  renderVaultTable();
}

/* -------------------- Combined Export / Import -------------------- */
function exportJSON() {
  let budgetData = null;
  const iframe = document.querySelector("#budgetView iframe");
  try {
    if (iframe && iframe.contentWindow) {
      const raw = iframe.contentWindow.localStorage.getItem("budgetData_v2");
      budgetData = raw ? JSON.parse(raw) : null;
    }
  } catch (e) {
    // cross-origin or file:// access may fail; fallback to parent storage
    try {
      const rawParent = localStorage.getItem("budgetData_v2");
      budgetData = rawParent ? JSON.parse(rawParent) : null;
    } catch (err) {
      budgetData = null;
    }
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    tasks,
    vault: vaultEntries,
    budget: budgetData
  };
  downloadObjectAsJson(payload, `kanban-backup-${(new Date()).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
}

function importJSON() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          tasks = parsed.tasks;
          saveTasksToLocal();
        }
        if (parsed.vault && Array.isArray(parsed.vault)) {
          vaultEntries = parsed.vault;
          saveVaultToLocal();
        }
        if (parsed.budget) {
          // attempt to write to iframe localStorage (same-origin)
          const iframe = document.querySelector("#budgetView iframe");
          try {
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.localStorage.setItem("budgetData_v2", JSON.stringify(parsed.budget));
              iframe.contentWindow.location.reload();
            } else {
              localStorage.setItem("budgetData_v2", JSON.stringify(parsed.budget));
            }
          } catch (err) {
            // fallback
            localStorage.setItem("budgetData_v2", JSON.stringify(parsed.budget));
          }
        }
        renderTasks();
        renderCalendar();
        renderVaultTable();
        alert("Import complete.");
      } catch (err) {
        console.error(err);
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/* -------------------- Initialization -------------------- */
(function init() {
  // wire calendar nav buttons if present
  const headerBtns = document.querySelectorAll(".calendar-header button");
  if (headerBtns && headerBtns.length >= 2) {
    headerBtns[0].addEventListener("click", prevMonth);
    headerBtns[1].addEventListener("click", nextMonth);
  }

  // close modal by clicking backdrop
  const modal = document.getElementById("taskModal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target.id === "taskModal") closeModal();
    });
  }

  // Setup column drop behavior
  setupColumnDrop();

  // initial render
  renderTasks();
  renderCalendar();
  renderVaultTable();
  showKanban();
})();
