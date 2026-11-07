import { dateKey, parseDate } from "./dates.js";

export function createGoal(fields) {
  return {
    id: crypto.randomUUID(),
    title: fields.title.trim(),
    description: fields.description.trim(),
    start: fields.start,
    end: fields.end,
    target: fields.target ? Number(fields.target) : null,
    unit: fields.unit.trim(),
    minimum: fields.minimum.trim(),
    action: fields.action.trim(),
    status: "active",
    pausedAt: null,
    pausedPeriods: []
  };
}

export function isActiveOnDate(goal, key) {
  if (key < goal.start || key > goal.end) return false;
  if (goal.status === "archived") return false;
  const paused = (goal.pausedPeriods || []).some(period =>
    key >= period.start && (!period.end || key <= period.end)
  );
  if (paused) return false;
  if (goal.status === "paused" && goal.pausedAt && key >= goal.pausedAt) return false;
  return true;
}

export function getGoalStatus(goal, today) {
  if (goal.status === "archived") return "Archived";
  if (goal.status === "paused") return "Paused";
  if (goal.end < today) return "Ended";
  if (goal.start > today) return "Planned";
  return "Active";
}

export function updateGoal(goals, id, changes) {
  return goals.map(goal => goal.id === id ? { ...goal, ...changes } : goal);
}
