const STUDENTS = [
  { matric: "STU/2024/001", name: "Amara Okafor", room: "A-102", inside: true },
  { matric: "STU/2024/002", name: "Daniel Ibrahim", room: "A-105", inside: true },
  { matric: "STU/2024/003", name: "Zainab Bello", room: "B-204", inside: false },
  { matric: "STU/2024/004", name: "David Eze", room: "B-208", inside: true },
  { matric: "STU/2024/005", name: "Mariam Yusuf", room: "C-110", inside: true },
  { matric: "STU/2024/006", name: "Samuel Adeyemi", room: "C-112", inside: false }
];

const STORAGE_KEY = "hostelTrackDemoV1";
const $ = (selector) => document.querySelector(selector);

function createInitialState() {
  const now = new Date();
  const earlier = (minutes) => new Date(now.getTime() - minutes * 60000).toISOString();
  const students = STUDENTS.map(student => ({ ...student }));
  const records = [
    { matric: "STU/2024/003", type: "checkout", time: earlier(160) },
    { matric: "STU/2024/001", type: "checkin", time: earlier(130) },
    { matric: "STU/2024/006", type: "checkout", time: earlier(105) },
    { matric: "STU/2024/004", type: "checkin", time: earlier(65) },
    { matric: "STU/2024/002", type: "checkin", time: earlier(35) }
  ];
  return { students, records };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.students) && Array.isArray(parsed.records)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load saved demo data:", error);
  }
  const initial = createInitialState();
  saveState(initial);
  return initial;
}

let state = loadState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    showMessage("Your browser could not save this record. Check browser storage settings.", "error");
  }
}

function formatDateTime(iso) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date(iso));
}

function initials(name) {
  return name.split(" ").map(part => part[0]).slice(0, 2).join("").toUpperCase();
}

function studentByMatric(matric) {
  return state.students.find(student => student.matric.toLowerCase() === matric.trim().toLowerCase());
}

function showMessage(message, type) {
  const box = $("#form-message");
  box.textContent = message;
  box.className = `form-message ${type}`;
}

function renderStats() {
  const inside = state.students.filter(student => student.inside).length;
  const today = new Date().toDateString();
  const todayRecords = state.records.filter(record => new Date(record.time).toDateString() === today);
  $("#total-students").textContent = state.students.length;
  $("#inside-count").textContent = inside;
  $("#outside-count").textContent = state.students.length - inside;
  $("#movement-count").textContent = todayRecords.length;
}

function renderRoster() {
  const container = $("#roster-list");
  container.innerHTML = "";
  state.students.forEach(student => {
    const item = document.createElement("div");
    item.className = "roster-item";
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = initials(student.name);
    const info = document.createElement("div");
    info.className = "roster-info";
    const name = document.createElement("strong");
    name.textContent = student.name;
    const details = document.createElement("small");
    details.textContent = `${student.matric} · Room ${student.room}`;
    info.append(name, details);
    const badge = document.createElement("span");
    badge.className = `pill ${student.inside ? "in" : "out"}`;
    badge.textContent = student.inside ? "In hostel" : "Checked out";
    item.append(avatar, info, badge);
    container.append(item);
  });
}

function renderRecords() {
  const tbody = $("#records-body");
  const search = $("#search-input").value.trim().toLowerCase();
  const type = $("#type-filter").value;
  const filtered = [...state.records]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .filter(record => {
      const student = studentByMatric(record.matric);
      if (!student) return false;
      const matchesSearch = student.name.toLowerCase().includes(search) || student.matric.toLowerCase().includes(search);
      return matchesSearch && (type === "all" || record.type === type);
    });

  tbody.innerHTML = "";
  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "empty-state";
    cell.textContent = "No attendance records match your search.";
    row.append(cell);
    tbody.append(row);
  } else {
    filtered.forEach(record => {
      const student = studentByMatric(record.matric);
      const row = document.createElement("tr");
      const studentCell = document.createElement("td");
      const studentWrap = document.createElement("div");
      studentWrap.className = "student-cell";
      const avatar = document.createElement("span");
      avatar.className = "mini-avatar";
      avatar.textContent = initials(student.name);
      const name = document.createElement("strong");
      name.textContent = student.name;
      studentWrap.append(avatar, name);
      studentCell.append(studentWrap);

      const matricCell = document.createElement("td");
      matricCell.textContent = student.matric;
      const movementCell = document.createElement("td");
      movementCell.className = `movement ${record.type}`;
      movementCell.textContent = record.type === "checkin" ? "↙ Check-in" : "↗ Check-out";
      const timeCell = document.createElement("td");
      timeCell.textContent = formatDateTime(record.time);
      const statusCell = document.createElement("td");
      const badge = document.createElement("span");
      badge.className = `pill ${student.inside ? "in" : "out"}`;
      badge.textContent = student.inside ? "In hostel" : "Outside";
      statusCell.append(badge);
      row.append(studentCell, matricCell, movementCell, timeCell, statusCell);
      tbody.append(row);
    });
  }
  $("#record-summary").textContent = `Showing ${filtered.length} of ${state.records.length} records`;
}

function renderAll() {
  renderStats();
  renderRoster();
  renderRecords();
}

$("#attendance-form").addEventListener("submit", event => {
  event.preventDefault();
  const matric = $("#matric").value.trim();
  const type = $("#movement").value;
  const student = studentByMatric(matric);

  if (!student) {
    showMessage("Student not found. Check the matriculation number and try again.", "error");
    return;
  }
  if (type === "checkin" && student.inside) {
    showMessage(`${student.name} is already marked as in the hostel. Check out first.`, "error");
    return;
  }
  if (type === "checkout" && !student.inside) {
    showMessage(`${student.name} is already checked out. Check in before checking out again.`, "error");
    return;
  }

  student.inside = type === "checkin";
  state.records.push({ matric: student.matric, type, time: new Date().toISOString() });
  saveState();
  renderAll();
  showMessage(`${student.name}: ${type === "checkin" ? "check-in" : "check-out"} recorded successfully at ${new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit" }).format(new Date())}.`, "success");
  $("#attendance-form").reset();
});

document.querySelectorAll(".demo-fill").forEach(button => {
  button.addEventListener("click", () => {
    $("#matric").value = button.dataset.matric;
    $("#matric").focus();
  });
});

$("#search-input").addEventListener("input", renderRecords);
$("#type-filter").addEventListener("change", renderRecords);

$("#reset-btn").addEventListener("click", () => {
  const confirmed = window.confirm("Reset all changes and restore the original demo data?");
  if (!confirmed) return;
  state = createInitialState();
  saveState();
  $("#search-input").value = "";
  $("#type-filter").value = "all";
  $("#attendance-form").reset();
  $("#form-message").className = "form-message";
  renderAll();
});

$("#export-btn").addEventListener("click", () => {
  const rows = [["Student", "Matric Number", "Movement", "Date and Time", "Status After Movement"]];
  [...state.records].sort((a, b) => new Date(b.time) - new Date(a.time)).forEach(record => {
    const student = studentByMatric(record.matric);
    if (!student) return;
    rows.push([student.name, student.matric, record.type === "checkin" ? "Check-in" : "Check-out", formatDateTime(record.time), student.inside ? "In hostel" : "Outside"]);
  });
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hostel-attendance-records.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
});

$("#today-label").textContent = new Intl.DateTimeFormat("en-NG", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
}).format(new Date());

renderAll();
