import { addDays, dateKey, parseDate, monthName } from "./dates.js";
import { getGoalStatus } from "./goals.js";
import { getStreak, countCompleted, getWeeklyCount } from "./streaks.js";

export function renderCalendar(goal, completions, container) {
  const start = parseDate(goal.start);
  const end = parseDate(goal.end);
  const today = dateKey(new Date());
  const days = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(new Date(day));
  const offset = start.getDay();
  const cells = [...Array(offset).fill(null), ...days];
  const columns = [];
  for (let i = 0; i < cells.length; i += 7) columns.push(cells.slice(i, i + 7));
  const calendar = document.createElement("div");
  calendar.className = "calendar-wrap";
  const grid = document.createElement("div");
  grid.className = "contribution-calendar";
  grid.style.gridTemplateRows = "repeat(7, 11px)";
  columns.forEach(column => {
    for (let row = 0; row < 7; row += 1) {
      const day = column[row];
      const square = document.createElement("span");
      if (day) {
        const key = dateKey(day);
        square.className = `calendar-day${completions[goal.id]?.[key] ? " completed" : ""}${key > today ? " future" : ""}`;
        square.title = `${key}: ${completions[goal.id]?.[key] ? "completed" : key > today ? "future" : "not completed"}`;
        square.setAttribute("aria-label", square.title);
      } else {
        square.style.visibility = "hidden";
      }
      grid.append(square);
    }
  });
  calendar.append(grid);
  container.replaceChildren(calendar);
}

export function renderOverviews(goals, completions, today) {
  const list = document.querySelector("#overview-list");
  list.replaceChildren();
  goals.filter(goal => goal.status !== "archived").forEach(goal => {
    const streak = getStreak(goal, completions, today);
    const done = countCompleted(goal, completions);
    const weekly = getWeeklyCount(goal, completions, today);
    const status = getGoalStatus(goal, today);
    const card = document.createElement("article");
    card.className = "overview-card";
    const top = document.createElement("div");
    top.className = "overview-top";
    const heading = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = goal.title;
    const detail = document.createElement("p");
    detail.className = "goal-meta";
    detail.textContent = `${goal.start} to ${goal.end} · ${status}`;
    heading.append(title, detail);
    const stats = document.createElement("p");
    stats.className = "goal-meta";
    stats.textContent = `${done} completed · ${weekly}/7 this week · ${streak.current} day streak`;
    top.append(heading, stats);
    card.append(top);
    const calendarHolder = document.createElement("div");
    renderCalendar(goal, completions, calendarHolder);
    card.append(calendarHolder);
    const legend = document.createElement("div");
    legend.className = "calendar-legend";
    legend.innerHTML = `<span class="calendar-day completed"></span> Completed <span class="calendar-day"></span> Not completed <span class="calendar-day future"></span> Future`;
    card.append(legend);
    list.append(card);
  });
  document.querySelector("#empty-overviews").hidden = goals.some(goal => goal.status !== "archived");
}
