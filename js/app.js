import { loadData, saveData, exportData, validateImport } from "./storage.js";
import { createGoal, isActiveOnDate, getGoalStatus, updateGoal } from "./goals.js";
import { dateKey, parseDate, addDays, formatDate, monthName } from "./dates.js";
import { getStreak } from "./streaks.js";
import { showCelebration } from "./celebrations.js";
import { initTheme } from "./themes.js";
import { initNavigation, showPage } from "./navigation.js";
import { createDatePicker } from "./date-picker.js";
import { renderOverviews } from "./calendar.js";

const data = loadData();
const today = new Date();
let selectedDate = new Date(today);
let editingId = null;
let toastTimer;
const $ = selector => document.querySelector(selector);
const todayKey = () => dateKey(new Date());

function persist() {
  saveData(data);
}

function toast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove("show"), 2300);
}

function openGoalDialog(goal = null) {
  editingId = goal?.id || null;
  $("#goal-dialog-title").textContent = goal ? "Edit your goal" : "Create a goal";
  $("#goal-title").value = goal?.title || "";
  $("#goal-description").value = goal?.description || "";
  $("#goal-start").value = goal?.start || dateKey(selectedDate);
  $("#goal-end").value = goal?.end || dateKey(addDays(selectedDate, 29));
  $("#goal-target").value = goal?.target || "";
  $("#goal-unit").value = goal?.unit || "";
  $("#goal-minimum").value = goal?.minimum || "";
  $("#goal-action").value = goal?.action || "";
  $("#goal-form-error").textContent = "";
  $("#delete-goal").hidden = !goal;
  $("#goal-dialog").showModal();
}

function readGoalForm() {
  return {
    title: $("#goal-title").value,
    description: $("#goal-description").value,
    start: $("#goal-start").value,
    end: $("#goal-end").value,
    target: $("#goal-target").value,
    unit: $("#goal-unit").value,
    minimum: $("#goal-minimum").value,
    action: $("#goal-action").value
  };
}

function renderToday() {
  const key = dateKey(selectedDate);
  $("#today-date-label").textContent = formatDate(selectedDate, { month: "long", year: "numeric" });
  $("#date-picker-trigger").textContent = formatDate(selectedDate);
  $("#next-day").disabled = key >= todayKey();
  const active = data.goals.filter(goal => isActiveOnDate(goal, key));
  const list = $("#today-goals");
  list.replaceChildren();
  let completed = 0;

  active.forEach(goal => {
    const done = Boolean(data.completions[goal.id]?.[key]);
    if (done) completed += 1;
    const card = document.createElement("article");
    card.className = "goal-card";
    const top = document.createElement("div");
    top.className = "goal-card-top";
    const details = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = goal.title;
    const description = document.createElement("p");
    description.className = "goal-description";
    description.textContent = goal.description || goal.minimum;
    const meta = document.createElement("p");
    meta.className = "goal-meta";
    const streak = getStreak(goal, data.completions, todayKey());
    meta.textContent = `${streak.current} day streak · ${goal.start} to ${goal.end}`;
    details.append(title, description, meta);
    const menu = document.createElement("div");
    menu.className = "goal-menu";
    menu.append(makeAction("Edit", () => openGoalDialog(goal)));
    menu.append(makeAction("Pause", () => pauseGoal(goal)));
    top.append(details, menu);
    const actionRow = document.createElement("div");
    actionRow.className = `goal-action-row${done ? " done" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `check-${goal.id}`;
    checkbox.checked = done;
    checkbox.disabled = key > todayKey();
    checkbox.addEventListener("change", () => toggleCompletion(goal, key, checkbox.checked));
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = goal.action;
    actionRow.append(checkbox, label);
    card.append(top, actionRow);
    list.append(card);
  });

  $("#today-summary").textContent = active.length ? `${completed} of ${active.length} daily actions completed` : "";
  $("#empty-today").hidden = active.length > 0;
}

function makeAction(label, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "small-action";
  button.textContent = label;
  button.addEventListener("click", callback);
  return button;
}

function toggleCompletion(goal, key, checked) {
  if (!data.completions[goal.id]) data.completions[goal.id] = {};
  data.completions[goal.id][key] = checked;
  persist();
  renderAll();

  if (checked && key === todayKey()) {
    const streak = getStreak(goal, data.completions, todayKey()).current;
    if (streak > 0 && streak % 7 === 0) {
      const milestoneKey = `${goal.id}:${streak}`;
      if (!data.milestones[milestoneKey]) {
        data.milestones[milestoneKey] = true;
        persist();
        showCelebration("A whole week!", `Yay! You ${goal.minimum.toLowerCase()} every day for ${streak} days.`);
      }
    }
    if (goal.target && goal.unit) {
      const total = Object.values(data.completions[goal.id]).filter(Boolean).length;
      if (total >= goal.target && !data.milestones[`${goal.id}:target`]) {
        data.milestones[`${goal.id}:target`] = true;
        persist();
        showCelebration("You reached your goal!", `Yay! You completed your goal: ${goal.target} ${goal.unit}.`);
      }
    }
  }
}

function pauseGoal(goal) {
  const pausedAt = todayKey();
  const periods = [...(goal.pausedPeriods || []), { start: pausedAt, end: null }];
  data.goals = updateGoal(data.goals, goal.id, { status: "paused", pausedAt, pausedPeriods: periods });
  persist();
  renderAll();
  toast("Goal paused. Your history is still here.");
}

function resumeGoal(goal) {
  const yesterday = dateKey(addDays(new Date(), -1));
  const periods = (goal.pausedPeriods || []).map(period =>
    period.end === null ? { ...period, end: yesterday } : period
  );
  data.goals = updateGoal(data.goals, goal.id, { status: "active", pausedAt: null, pausedPeriods: periods });
  persist();
  renderAll();
  toast("Goal resumed.");
}

function renderOverviewsAndMonths() {
  renderOverviews(data.goals, data.completions, todayKey());
  const container = $("#month-list");
  container.replaceChildren();
  const months = new Map();
  data.goals.filter(goal => goal.status !== "archived").forEach(goal => {
    const cursor = new Date(`${goal.start}T12:00:00`);
    const end = new Date(`${goal.end}T12:00:00`);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      if (!months.has(key)) months.set(key, []);
      if (!months.get(key).some(item => item.id === goal.id)) months.get(key).push(goal);
      cursor.setMonth(cursor.getMonth() + 1, 1);
    }
  });
  const now = new Date();
  for (let offset = -2; offset < 10; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const goals = months.get(key) || [];
    const card = document.createElement("article");
    card.className = "month-card";
    const top = document.createElement("div");
    top.className = "month-top";
    const heading = document.createElement("h2");
    heading.textContent = monthName(date);
    const count = document.createElement("span");
    count.className = "goal-meta";
    count.textContent = `${goals.length} ${goals.length === 1 ? "goal" : "goals"}`;
    top.append(heading, count);
    card.append(top);
    if (goals.length) {
      const goalList = document.createElement("div");
      goalList.className = "month-goal-list";
      goals.forEach(goal => {
        const row = document.createElement("div");
        row.className = "month-goal";
        const title = document.createElement("strong");
        title.textContent = goal.title;
        const status = document.createElement("span");
        status.textContent = getGoalStatus(goal, todayKey());
        row.append(title, status);
        if (goal.status === "paused") {
          const resume = makeAction("Resume", () => resumeGoal(goal));
          row.append(resume);
        } else if (goal.status === "active") {
          const pause = makeAction("Pause", () => pauseGoal(goal));
          row.append(pause);
        }
        goalList.append(row);
      });
      card.append(goalList);
    } else {
      const empty = document.createElement("p");
      empty.className = "goal-meta";
      empty.textContent = "No goals planned.";
      card.append(empty);
    }
    container.append(card);
  }
}

function renderAll() {
  renderToday();
  renderOverviewsAndMonths();
}

function initEvents() {
  ["#add-goal-today", "#add-goal-overview", "#add-goal-monthly", "#create-first-goal", "#create-overview-goal"]
    .forEach(selector => $(selector).addEventListener("click", () => openGoalDialog()));
  document.querySelectorAll(".close-dialog").forEach(button => button.addEventListener("click", () => button.closest("dialog").close()));
  $("#goal-form").addEventListener("submit", event => {
    event.preventDefault();
    const fields = readGoalForm();
    if (!fields.start || !fields.end || fields.end < fields.start) {
      $("#goal-form-error").textContent = "Choose an end date that is the same as or later than the start date.";
      return;
    }
    if (editingId) {
      data.goals = updateGoal(data.goals, editingId, {
        ...fields, title: fields.title.trim(), description: fields.description.trim(),
        target: fields.target ? Number(fields.target) : null, unit: fields.unit.trim(),
        minimum: fields.minimum.trim(), action: fields.action.trim()
      });
    } else {
      data.goals.push(createGoal(fields));
    }
    persist();
    $("#goal-dialog").close();
    renderAll();
    toast(editingId ? "Goal updated." : "Goal created.");
  });
  $("#delete-goal").addEventListener("click", () => {
    if (!editingId || !confirm("Delete this goal and its saved history? This cannot be undone.")) return;
    data.goals = data.goals.filter(goal => goal.id !== editingId);
    delete data.completions[editingId];
    Object.keys(data.milestones).forEach(key => { if (key.startsWith(`${editingId}:`)) delete data.milestones[key]; });
    persist();
    $("#goal-dialog").close();
    renderAll();
    toast("Goal deleted.");
  });
  $("#previous-day").addEventListener("click", () => { selectedDate = addDays(selectedDate, -1); renderToday(); picker.refresh(selectedDate); });
  $("#next-day").addEventListener("click", () => { selectedDate = addDays(selectedDate, 1); renderToday(); picker.refresh(selectedDate); });
  $("#go-to-today").addEventListener("click", () => { selectedDate = new Date(); renderToday(); picker.refresh(selectedDate); });
  $("#date-picker-trigger").addEventListener("click", () => { $("#date-picker").hidden = !$("#date-picker").hidden; });
  $("#settings-toggle").addEventListener("click", () => $("#settings-dialog").showModal());
  $("#export-data").addEventListener("click", () => { exportData(data); $("#settings-message").textContent = "Backup exported."; });
  $("#import-data").addEventListener("change", async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!validateImport(parsed)) throw new Error("The file does not look like a valid Your Goals backup.");
      if (!confirm("Importing replaces the goals currently saved in this browser. Continue?")) return;
      data.goals = parsed.goals;
      data.completions = parsed.completions;
      data.milestones = parsed.milestones || {};
      data.notes = parsed.notes || {};
      persist();
      renderAll();
      $("#settings-message").textContent = "Backup imported.";
    } catch (error) {
      $("#settings-message").textContent = error.message || "Could not read that backup.";
    }
    event.target.value = "";
  });
  $("#celebration-close").addEventListener("click", () => $("#celebration-dialog").close());
  initNavigation(showPage);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") $("#date-picker").hidden = true;
  });
}

const picker = createDatePicker($("#date-picker"), selectedDate, date => {
  selectedDate = date;
  renderToday();
});
initTheme();
initEvents();
renderAll();

const cursor = $("#cursor-glow");
if (matchMedia("(hover: hover) and (pointer: fine)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  document.addEventListener("pointermove", event => {
    cursor.style.display = "block";
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  });
  document.addEventListener("pointerleave", () => { cursor.style.display = "none"; });
}

requestAnimationFrame(() => {
  $("#loading-screen").classList.add("hide");
  setTimeout(() => $("#loading-screen").remove(), 220);
});
