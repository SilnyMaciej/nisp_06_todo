const STORAGE_KEY = "companyflow_data_v1";
const THEME_KEY = "companyflow_theme";

const state = {
  tasks: [],
  sortMode: "newest"
};

const els = {
  form: document.getElementById("taskForm"),
  taskId: document.getElementById("taskId"),
  title: document.getElementById("title"),
  project: document.getElementById("project"),
  description: document.getElementById("description"),
  department: document.getElementById("department"),
  assignee: document.getElementById("assignee"),
  priority: document.getElementById("priority"),
  status: document.getElementById("status"),
  dueDate: document.getElementById("dueDate"),
  tags: document.getElementById("tags"),
  notes: document.getElementById("notes"),

  titleError: document.getElementById("titleError"),
  projectError: document.getElementById("projectError"),

  searchInput: document.getElementById("searchInput"),
  filterStatus: document.getElementById("filterStatus"),
  filterPriority: document.getElementById("filterPriority"),
  filterProject: document.getElementById("filterProject"),

  sortNewestBtn: document.getElementById("sortNewestBtn"),
  sortPriorityBtn: document.getElementById("sortPriorityBtn"),
  sortDeadlineBtn: document.getElementById("sortDeadlineBtn"),

  exportJsonBtn: document.getElementById("exportJsonBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  importJsonInput: document.getElementById("importJsonInput"),

  tableBody: document.getElementById("taskTableBody"),
  rowTemplate: document.getElementById("taskRowTemplate"),
  emptyState: document.getElementById("emptyState"),
  resultsCount: document.getElementById("resultsCount"),
  activityLog: document.getElementById("activityLog"),
  liveRegion: document.getElementById("liveRegion"),

  statTotal: document.getElementById("statTotal"),
  statNew: document.getElementById("statNew"),
  statInProgress: document.getElementById("statInProgress"),
  statDone: document.getElementById("statDone"),
  statOverdue: document.getElementById("statOverdue"),
  statCritical: document.getElementById("statCritical"),

  themeToggle: document.getElementById("themeToggle"),
  seedDataBtn: document.getElementById("seedDataBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  resetFormBtn: document.getElementById("resetFormBtn")
};

function announce(message) {
  els.liveRegion.textContent = "";
  setTimeout(() => {
    els.liveRegion.textContent = message;
  }, 50);
}

function logActivity(message) {
  const li = document.createElement("li");
  const date = new Date().toLocaleString("pl-PL");
  li.textContent = `${date} — ${message}`;
  els.activityLog.prepend(li);

  while (els.activityLog.children.length > 15) {
    els.activityLog.removeChild(els.activityLog.lastChild);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    state.tasks = [];
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.tasks = Array.isArray(parsed) ? parsed : [];
  } catch {
    state.tasks = [];
  }
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "dark";
  applyTheme(theme);
}

function applyTheme(theme) {
  document.body.classList.toggle("light-theme", theme === "light");
  els.themeToggle.setAttribute("aria-pressed", String(theme === "light"));
  els.themeToggle.textContent = theme === "light" ? "Włącz ciemny motyw" : "Włącz jasny motyw";
}

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function parseTags(value) {
  return value
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pl-PL");
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "zakończone") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function validateForm() {
  let isValid = true;

  if (!els.title.value.trim()) {
    els.titleError.hidden = false;
    els.title.setAttribute("aria-invalid", "true");
    isValid = false;
  } else {
    els.titleError.hidden = true;
    els.title.removeAttribute("aria-invalid");
  }

  if (!els.project.value.trim()) {
    els.projectError.hidden = false;
    els.project.setAttribute("aria-invalid", "true");
    isValid = false;
  } else {
    els.projectError.hidden = true;
    els.project.removeAttribute("aria-invalid");
  }

  return isValid;
}

function getTaskFromForm() {
  return {
    id: els.taskId.value || generateId(),
    title: els.title.value.trim(),
    project: els.project.value,
    description: els.description.value.trim(),
    department: els.department.value.trim(),
    assignee: els.assignee.value.trim(),
    priority: els.priority.value,
    status: els.status.value,
    dueDate: els.dueDate.value,
    tags: parseTags(els.tags.value),
    notes: els.notes.value.trim(),
    createdAt: els.taskId.value ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function resetForm() {
  els.form.reset();
  els.taskId.value = "";
  els.titleError.hidden = true;
  els.projectError.hidden = true;
  els.title.removeAttribute("aria-invalid");
  els.project.removeAttribute("aria-invalid");
  els.status.value = "nowe";
  els.priority.value = "średni";
}

function handleFormSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    announce("Formularz zawiera błędy. Popraw wymagane pola.");
    return;
  }

  const task = getTaskFromForm();
  const existingIndex = state.tasks.findIndex(t => t.id === task.id);

  if (existingIndex >= 0) {
    const existing = state.tasks[existingIndex];
    state.tasks[existingIndex] = {
      ...existing,
      ...task,
      createdAt: existing.createdAt || new Date().toISOString()
    };
    logActivity(`Zaktualizowano zadanie: ${task.title}`);
    announce(`Zadanie ${task.title} zostało zaktualizowane.`);
  } else {
    state.tasks.unshift(task);
    logActivity(`Dodano zadanie: ${task.title}`);
    announce(`Dodano nowe zadanie: ${task.title}.`);
  }

  saveState();
  resetForm();
  render();
}

function editTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  els.taskId.value = task.id;
  els.title.value = task.title || "";
  els.project.value = task.project || "";
  els.description.value = task.description || "";
  els.department.value = task.department || "";
  els.assignee.value = task.assignee || "";
  els.priority.value = task.priority || "średni";
  els.status.value = task.status || "nowe";
  els.dueDate.value = task.dueDate || "";
  els.tags.value = (task.tags || []).join(", ");
  els.notes.value = task.notes || "";

  window.scrollTo({ top: 0, behavior: "smooth" });
  els.title.focus();
  announce(`Edytujesz zadanie: ${task.title}`);
}

function deleteTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const confirmed = window.confirm(`Czy na pewno usunąć zadanie: "${task.title}"?`);
  if (!confirmed) return;

  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  render();
  logActivity(`Usunięto zadanie: ${task.title}`);
  announce(`Usunięto zadanie ${task.title}.`);
}

function cycleStatus(id) {
  const order = ["nowe", "w toku", "wstrzymane", "zakończone"];
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const index = order.indexOf(task.status);
  task.status = order[(index + 1) % order.length];
  task.updatedAt = new Date().toISOString();

  saveState();
  render();
  logActivity(`Zmieniono status zadania "${task.title}" na: ${task.status}`);
  announce(`Status zadania ${task.title} zmieniono na ${task.status}.`);
}

function getPriorityWeight(priority) {
  switch (priority) {
    case "krytyczny":
      return 4;
    case "wysoki":
      return 3;
    case "średni":
      return 2;
    case "niski":
      return 1;
    default:
      return 0;
  }
}

function getFilteredTasks() {
  const search = els.searchInput.value.trim().toLowerCase();
  const filterStatus = els.filterStatus.value;
  const filterPriority = els.filterPriority.value;
  const filterProject = els.filterProject.value;

  let tasks = [...state.tasks].filter(task => {
    const haystack = [
      task.title,
      task.description,
      task.department,
      task.assignee,
      task.project,
      task.notes,
      ...(task.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    const matchesProject = !filterProject || task.project === filterProject;

    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  if (state.sortMode === "newest") {
    tasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  if (state.sortMode === "priority") {
    tasks.sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));
  }

  if (state.sortMode === "deadline") {
    tasks.sort((a, b) => {
      const aVal = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bVal = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aVal - bVal;
    });
  }

  return tasks;
}

function badge(text, className) {
  const span = document.createElement("span");
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

function renderTasks() {
  const tasks = getFilteredTasks();
  els.tableBody.innerHTML = "";

  if (tasks.length === 0) {
    els.emptyState.hidden = false;
  } else {
    els.emptyState.hidden = true;
  }

  for (const task of tasks) {
    const fragment = els.rowTemplate.content.cloneNode(true);

    fragment.querySelector(".task-title").textContent = task.title;
    fragment.querySelector(".task-desc").textContent = task.description || "Brak opisu";
    fragment.querySelector(".task-project").textContent = task.project || "—";
    fragment.querySelector(".task-department").textContent = task.department || "—";
    fragment.querySelector(".task-assignee").textContent = task.assignee || "—";

    const priorityCell = fragment.querySelector(".task-priority");
    priorityCell.appendChild(
      badge(task.priority, `badge-priority-${normalizeClass(task.priority)}`)
    );

    const statusCell = fragment.querySelector(".task-status");
    statusCell.appendChild(
      badge(task.status, `badge-status-${normalizeClass(task.status)}`)
    );

    const dueCell = fragment.querySelector(".task-dueDate");
    dueCell.textContent = formatDate(task.dueDate);
    if (isOverdue(task)) {
      dueCell.classList.add("overdue");
      dueCell.textContent += " (po terminie)";
    }

    const tagsCell = fragment.querySelector(".task-tags");
    if (task.tags && task.tags.length > 0) {
      task.tags.forEach(tagText => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tagText;
        tagsCell.appendChild(span);
      });
    } else {
      tagsCell.textContent = "—";
    }

    const actionsCell = fragment.querySelector(".task-actions");
    const wrapper = document.createElement("div");
    wrapper.className = "task-actions-list";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-secondary";
    editBtn.textContent = "Edytuj";
    editBtn.setAttribute("aria-label", `Edytuj zadanie ${task.title}`);
    editBtn.addEventListener("click", () => editTask(task.id));

    const statusBtn = document.createElement("button");
    statusBtn.type = "button";
    statusBtn.className = "btn btn-secondary";
    statusBtn.textContent = "Zmień status";
    statusBtn.setAttribute("aria-label", `Zmień status zadania ${task.title}`);
    statusBtn.addEventListener("click", () => cycleStatus(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Usuń";
    deleteBtn.setAttribute("aria-label", `Usuń zadanie ${task.title}`);
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    wrapper.append(editBtn, statusBtn, deleteBtn);
    actionsCell.appendChild(wrapper);

    els.tableBody.appendChild(fragment);
  }

  els.resultsCount.textContent = `Liczba widocznych rekordów: ${tasks.length}`;
}

function normalizeClass(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ż/g, "z")
    .replace(/ź/g, "z");
}

function renderStats() {
  const all = state.tasks.length;
  const countNew = state.tasks.filter(t => t.status === "nowe").length;
  const countInProgress = state.tasks.filter(t => t.status === "w toku").length;
  const countDone = state.tasks.filter(t => t.status === "zakończone").length;
  const countOverdue = state.tasks.filter(isOverdue).length;
  const countCritical = state.tasks.filter(t => t.priority === "krytyczny").length;

  els.statTotal.textContent = all;
  els.statNew.textContent = countNew;
  els.statInProgress.textContent = countInProgress;
  els.statDone.textContent = countDone;
  els.statOverdue.textContent = countOverdue;
  els.statCritical.textContent = countCritical;
}

function render() {
  renderTasks();
  renderStats();
}

function exportJson() {
  const data = JSON.stringify(state.tasks, null, 2);
  downloadFile(data, "companyflow-export.json", "application/json");
  logActivity("Wyeksportowano dane do pliku JSON");
  announce("Dane wyeksportowano do pliku JSON.");
}

function exportCsv() {
  const headers = [
    "id",
    "title",
    "project",
    "description",
    "department",
    "assignee",
    "priority",
    "status",
    "dueDate",
    "tags",
    "notes",
    "createdAt",
    "updatedAt"
  ];

  const rows = state.tasks.map(task =>
    [
      task.id,
      task.title,
      task.project,
      task.description,
      task.department,
      task.assignee,
      task.priority,
      task.status,
      task.dueDate,
      (task.tags || []).join("|"),
      task.notes,
      task.createdAt,
      task.updatedAt
    ]
      .map(value => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(";")
  );

  const csv = [headers.join(";"), ...rows].join("\n");
  downloadFile(csv, "companyflow-export.csv", "text/csv;charset=utf-8;");
  logActivity("Wyeksportowano dane do pliku CSV");
  announce("Dane wyeksportowano do pliku CSV.");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = event => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (!Array.isArray(parsed)) {
        throw new Error("Niepoprawna struktura pliku.");
      }

      state.tasks = parsed.map(item => ({
        id: item.id || generateId(),
        title: item.title || "Bez tytułu",
        project: item.project || "",
        description: item.description || "",
        department: item.department || "",
        assignee: item.assignee || "",
        priority: item.priority || "średni",
        status: item.status || "nowe",
        dueDate: item.dueDate || "",
        tags: Array.isArray(item.tags) ? item.tags : [],
        notes: item.notes || "",
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString()
      }));

      saveState();
      render();
      logActivity("Zaimportowano dane z pliku JSON");
      announce("Dane zostały poprawnie zaimportowane.");
    } catch (error) {
      alert("Nie udało się zaimportować pliku JSON.");
      announce("Import nie powiódł się.");
    } finally {
      els.importJsonInput.value = "";
    }
  };

  reader.readAsText(file, "utf-8");
}

function seedDemoData() {
  state.tasks = [
    {
      id: generateId(),
      title: "Wdrożenie nowego modułu raportów sprzedażowych",
      project: "Sprzedaż",
      description: "Przygotowanie raportów miesięcznych i kwartalnych dla kierownictwa.",
      department: "IT",
      assignee: "Anna Nowak",
      priority: "wysoki",
      status: "w toku",
      dueDate: getFutureDate(5),
      tags: ["raporty", "zarząd", "BI"],
      notes: "Wymagane uzgodnienie z działem finansów.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: "Aktualizacja bazy pracowników",
      project: "HR",
      description: "Uzupełnienie danych personalnych i uprawnień systemowych.",
      department: "HR",
      assignee: "Marek Wiśniewski",
      priority: "średni",
      status: "nowe",
      dueDate: getFutureDate(12),
      tags: ["kadry", "uprawnienia"],
      notes: "Sprawdzić zgodność z polityką bezpieczeństwa.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: "Audyt faktur kosztowych",
      project: "Finanse",
      description: "Kontrola kompletności dokumentów za bieżący miesiąc.",
      department: "Finanse",
      assignee: "Karolina Zielińska",
      priority: "krytyczny",
      status: "wstrzymane",
      dueDate: getFutureDate(2),
      tags: ["audyt", "faktury", "kontrola"],
      notes: "Oczekiwanie na dane od dostawcy zewnętrznego.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      title: "Naprawa integracji CRM z infolinią",
      project: "CRM",
      description: "Błąd synchronizacji zgłoszeń klientów pomiędzy systemami.",
      department: "Obsługa Klienta",
      assignee: "Piotr Kowalczyk",
      priority: "krytyczny",
      status: "w toku",
      dueDate: getFutureDate(1),
      tags: ["integracja", "CRM", "klienci"],
      notes: "Wysoki wpływ na czas obsługi zgłoszeń.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  saveState();
  render();
  logActivity("Wczytano przykładowe dane demonstracyjne");
  announce("Wczytano dane demonstracyjne.");
}

function getFutureDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function clearAllData() {
  const confirmed = window.confirm("Czy na pewno usunąć wszystkie dane aplikacji?");
  if (!confirmed) return;

  state.tasks = [];
  saveState();
  render();
  resetForm();
  els.activityLog.innerHTML = "";
  logActivity("Wyczyszczono wszystkie dane aplikacji");
  announce("Usunięto wszystkie dane.");
}

function attachEvents() {
  els.form.addEventListener("submit", handleFormSubmit);
  els.resetFormBtn.addEventListener("click", resetForm);

  els.searchInput.addEventListener("input", render);
  els.filterStatus.addEventListener("change", render);
  els.filterPriority.addEventListener("change", render);
  els.filterProject.addEventListener("change", render);

  els.sortNewestBtn.addEventListener("click", () => {
    state.sortMode = "newest";
    render();
    announce("Posortowano po najnowszych.");
  });

  els.sortPriorityBtn.addEventListener("click", () => {
    state.sortMode = "priority";
    render();
    announce("Posortowano po priorytecie.");
  });

  els.sortDeadlineBtn.addEventListener("click", () => {
    state.sortMode = "deadline";
    render();
    announce("Posortowano po terminie.");
  });

  els.exportJsonBtn.addEventListener("click", exportJson);
  els.exportCsvBtn.addEventListener("click", exportCsv);

  els.importJsonInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (file) {
      importJson(file);
    }
  });

  els.seedDataBtn.addEventListener("click", seedDemoData);
  els.clearAllBtn.addEventListener("click", clearAllData);

  els.themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light-theme");
    const nextTheme = isLight ? "dark" : "light";
    applyTheme(nextTheme);
    saveTheme(nextTheme);
    announce(`Zmieniono motyw na ${nextTheme === "light" ? "jasny" : "ciemny"}.`);
  });

  document.addEventListener("keydown", event => {
    // Alt + N = fokus na formularz
    if (event.altKey && event.key.toLowerCase() === "n") {
      event.preventDefault();
      els.title.focus();
      announce("Przejście do formularza nowego zadania.");
    }

    // Alt + S = fokus na wyszukiwarkę
    if (event.altKey && event.key.toLowerCase() === "s") {
      event.preventDefault();
      els.searchInput.focus();
      announce("Przejście do pola wyszukiwania.");
    }
  });
}

function init() {
  loadState();
  loadTheme();
  attachEvents();
  render();

  if (state.tasks.length === 0) {
    logActivity("Aplikacja gotowa do pracy. Brak zapisanych rekordów.");
  } else {
    logActivity(`Załadowano ${state.tasks.length} rekordów z pamięci lokalnej.`);
  }
}

init();