/* script.js - Kanban + Calendar + Vault + Budget messaging
   - Fixed Kanban <-> Calendar sync
   - Drag & drop that persists status
   - Add from calendar day => creates Kanban task with dueDate
   - Theme toggle sends message to budget iframe
*/

/* -------------------- App State -------------------- */
let tasks = JSON.parse(localStorage.getItem("kanbanTasks")) || [];
let vaultEntries = JSON.parse(localStorage.getItem("vault_entries")) || [];
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let editingTaskId = null; // used for edit mode

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
function normalizeDateString(d) {
  if (!d) return "";
  // keep YYYY-MM-DD
  return String(d).slice(0, 10);
}

/* -------------------- Modal (Add/Edit Task) -------------------- */
function openModal(date = "", id = null) {
  const modal = document.getElementById("taskModal");
  modal.classList.remove("hidden");

  const inputDate = document.getElementById("taskDate");
  const title = document.getElementById("taskTitle");
  const desc = document.getElementById("taskDesc");
  const priority = document.getElementById("taskPriority");
  const modalTitle = document.getElementById("modalTitle");
  editingTaskId = null;

  if (id) {
    const t = tasks.find(x => x.id === id);
    if (t) {
      title.value = t.title;
      desc.value = t.desc || "";
      inputDate.value = t.dueDate || "";
      priority.value = t.priority || "medium";
      modalTitle.textContent = "Edit Task";
      editingTaskId = id;
    }
  } else {
    modalTitle.textContent = date ? `New Task — ${date}` : "New Task";
    title.value = "";
    desc.value = "";
    inputDate.value = date || "";
    priority.value = "medium";
  }

  setTimeout(() => title.focus(), 50);
}

function closeModal() {
  const modal = document.getElementById("taskModal");
  modal.classList.add("hidden");
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskDate").value = "";
  document.getElementById("taskPriority").value = "medium";
  editingTaskId = null;
}

/* -------------------- Kanban (add, render, drag/drop) -------------------- */
function saveTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const dueDate = normalizeDateString(document.getElementById("taskDate").value);
  const priority = document.getElementById("taskPriority").value || "medium";
  if (!title) { alert("Title required"); return; }

  if (editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) {
      t.title = title;
      t.desc = desc;
      t.dueDate = dueDate || "";
      t.priority = priority;
    }
  } else {
    const t = { id: Date.now(), title, desc, dueDate: dueDate || "", priority, status: "todo" };
    tasks.push(t);
  }

  saveTasksToLocal();
  renderTasks();
  renderCalendar();
  closeModal();
}

function renderTasks() {
  ["todo", "inprogress", "done"].forEach(status => {
    const container = document.querySelector(`.column[data-status="${status}"]`);
    if (!container) return;
    const list = container.querySelector('.task-list');
    if (!list) return;
    list.innerHTML = "";
    tasks.filter(t => (t.status || 'todo') === status).forEach(t => {
      const div = document.createElement("div");
      div.className = "task";
      div.draggable = true;
      div.dataset.id = t.id;

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

      // double-click to edit
      div.addEventListener("dblclick", () => openModal(null, t.id));

      addDragEvents(div);
      list.appendChild(div);
    });
  });

  // ensure drop targets are bound (in case DOM changed)
  setupColumnDrop();
}

/* drag helpers (robust) */
function addDragEvents(el) {
  el.addEventListener("dragstart", e => {
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(el.dataset.id));
    } catch (err) {}
    el.classList.add("dragging");
  });

  el.addEventListener("dragend", e => {
    e.target.classList.remove("dragging");
    document.querySelectorAll('.task-list, .column').forEach(node => node.classList.remove('drag-over'));
  });
}

/* attach droppable behavior to lists and columns */
function setupColumnDrop() {
  const lists = Array.from(document.querySelectorAll(".task-list"));
  const columns = Array.from(document.querySelectorAll(".column"));

  const addHandlers = (node) => {
    node.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      node.classList.add("drag-over");
    });

    node.addEventListener("dragleave", e => {
      node.classList.remove("drag-over");
    });

    node.addEventListener("drop", e => {
      e.preventDefault();
      node.classList.remove("drag-over");

      let idStr = null;
      try { idStr = e.dataTransfer.getData("text/plain"); } catch (err) { idStr = null; }
      let id = idStr ? parseInt(idStr, 10) : null;

      if (!id) {
        const dragging = document.querySelector(".dragging");
        if (dragging) id = parseInt(dragging.dataset.id, 10);
      }
      if (!id) return;

      let targetStatus = null;
      if (node.classList.contains('task-list')) {
        targetStatus = node.id;
      } else {
        const tl = node.querySelector('.task-list');
        if (tl && tl.id) targetStatus = tl.id;
        if (!targetStatus && node.dataset && node.dataset.status) targetStatus = node.dataset.status;
      }
      if (!targetStatus) return;

      const task = tasks.find(x => x.id === id);
      if (!task) return;

      task.status = targetStatus;
      saveTasksToLocal();
      renderTasks();
      renderCalendar();
    });
  };

  lists.forEach(addHandlers);
  columns.forEach(addHandlers);
}

/* -------------------- Calendar -------------------- */
function renderCalendar() {
  const grid = document.getElementById("calendarGrid");
  if (!grid) return;
  grid.innerHTML = "";
  const title = document.getElementById("calendarTitle");
  title.textContent = `${new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" })} ${currentYear}`;

  // unscheduled tasks
  const unscheduledEl = document.getElementById("unscheduledList");
  unscheduledEl.innerHTML = "";
  const uns = tasks.filter(t => !t.dueDate || normalizeDateString(t.dueDate) === "");
  if (uns.length === 0) {
    unscheduledEl.innerHTML = `<div class="muted">No unscheduled tasks</div>`;
  } else {
    uns.forEach(t => {
      const el = document.createElement("div");
      el.className = "unscheduled-item";
      el.innerHTML = `<strong>${escapeHtml(t.title)}</strong> <div class="muted small-badge">${t.priority.toUpperCase()}</div>`;
      el.addEventListener("click", () => openModal(null, t.id));
      unscheduledEl.appendChild(el);
    });
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayCell = document.createElement("div");
    dayCell.className = "day";

    const strong = document.createElement("strong");
    strong.textContent = d;
    dayCell.appendChild(strong);

    const today = new Date();
    if (today.getDate() === d && today.getMonth() === currentMonth && today.getFullYear() === currentYear) {
      dayCell.classList.add("today");
    }

    // filter tasks by normalized date string
    const dayTasks = tasks.filter(t => normalizeDateString(t.dueDate) === dateStr);
    dayTasks.slice(0, 3).forEach(t => {
      const b = document.createElement("div");
      b.className = `day-task ${t.priority}`;
      b.title = t.title;
      b.textContent = t.title.length > 22 ? t.title.slice(0, 19) + "..." : t.title;
      b.addEventListener("click", ev => {
        ev.stopPropagation();
        openModal(null, t.id); // edit
      });
      dayCell.appendChild(b);
    });

    if (dayTasks.length > 3) {
      const more = document.createElement("div");
      more.className = "more-count";
      more.textContent = `+${dayTasks.length - 3} more`;
      dayCell.appendChild(more);
    }

    // click a day to create a task on that date
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
  const iframe = document.getElementById("budgetIframe");
  try { iframe.contentWindow.location.reload(); } catch (e) {}
}

/* -------------------- Vault -------------------- */
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
  const show = confirm(`Account: ${found.site}\nUser: ${found.username}\n\nShow password?`);
  if (show) {
    alert(`Password: ${found.password}`);
    if (navigator.clipboard) navigator.clipboard.writeText(found.password).catch(()=>{});
  }
}

function vaultDelete(id) {
  if (!confirm("Delete this vault entry?")) return;
  vaultEntries = vaultEntries.filter(x => x.id !== id);
  saveVaultToLocal();
  renderVaultTable();
}

/* -------------------- Export / Import (with iframe messaging) -------------------- */
function exportJSON() {
  const iframe = document.getElementById("budgetIframe");
  const timeout = setTimeout(() => {
    const rawParent = localStorage.getItem("budgetData_v2");
    const budgetData = rawParent ? JSON.parse(rawParent) : null;
    finalizeExport(budgetData);
  }, 800);

  function finalizeExport(budgetData) {
    clearTimeout(timeout);
    const payload = {
      exportedAt: new Date().toISOString(),
      tasks,
      vault: vaultEntries,
      budget: budgetData
    };
    downloadObjectAsJson(payload, `kanban-backup-${(new Date()).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`);
  }

  function handleMessage(ev) {
    if (!ev.data || ev.data.type !== "budgetDataResponse") return;
    window.removeEventListener("message", handleMessage);
    finalizeExport(ev.data.payload);
  }
  window.addEventListener("message", handleMessage);

  try {
    if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: "requestBudget" }, "*");
  } catch (err) {}
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
        if (parsed.tasks && Array.isArray(parsed.tasks)) { tasks = parsed.tasks; saveTasksToLocal(); }
        if (parsed.vault && Array.isArray(parsed.vault)) { vaultEntries = parsed.vault; saveVaultToLocal(); }
        if (parsed.budget) {
          const iframe = document.getElementById("budgetIframe");
          try {
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: "importBudget", payload: parsed.budget }, "*");
            } else {
              localStorage.setItem("budgetData_v2", JSON.stringify(parsed.budget));
            }
          } catch (err) {
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

/* -------------------- Theme Toggle (emoji next to logo) -------------------- */
function initTheme() {
  const btn = document.getElementById("themeToggle");
  const saved = localStorage.getItem("myboard_theme");
  if (saved === "light") {
    document.body.classList.add("light");
    btn.textContent = "☀️";
  } else {
    document.body.classList.add("dark");
    btn.textContent = "🌙";
  }

  btn.addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");
    if (isDark) {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
      btn.textContent = "☀️";
      btn.classList.add("rotate");
      setTimeout(()=>btn.classList.remove("rotate"), 400);
      localStorage.setItem("myboard_theme", "light");
    } else {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
      btn.textContent = "🌙";
      btn.classList.add("rotate");
      setTimeout(()=>btn.classList.remove("rotate"), 400);
      localStorage.setItem("myboard_theme", "dark");
    }

    // Notify budget iframe about theme change
    const iframe = document.getElementById("budgetIframe");
    try {
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "setTheme", payload: document.body.classList.contains('light') ? 'light' : 'dark' }, "*");
      }
    } catch(e){}
  });
}

/* -------------------- Initialization -------------------- */
(function init() {
  // wire calendar nav
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if (prevBtn) prevBtn.addEventListener("click", prevMonth);
  if (nextBtn) nextBtn.addEventListener("click", nextMonth);

  // modal backdrop
  const modal = document.getElementById("taskModal");
  if (modal) modal.addEventListener("click", e => { if (e.target.id === "taskModal") closeModal(); });

  // modal save button
  const saveBtn = document.getElementById("saveTaskBtn");
  if (saveBtn) saveBtn.addEventListener("click", saveTask);

  // Setup column drop behavior
  setupColumnDrop();

  // initial render
  renderTasks();
  renderCalendar();
  renderVaultTable();
  showKanban();

  // theme
  initTheme();

  // messages from iframe
  window.addEventListener("message", ev => {
    const { data } = ev;
    if (!data || !data.type) return;
    if (data.type === "budgetDataResponse") {
      // handled by export listener
    } else if (data.type === "importBudgetAck") {
      console.info("Budget iframe imported data");
    }
  });

  // responsive: collapse sidebar on small screens
  const mq = window.matchMedia("(max-width:700px)");
  function handleM(q) {
    const sb = document.getElementById("sidebar");
    if (q.matches) sb.classList.add("collapsed"); else sb.classList.remove("collapsed");
  }
  handleM(mq);
  mq.addListener(handleM);
})();
