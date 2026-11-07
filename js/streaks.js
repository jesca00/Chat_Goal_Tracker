import { addDays, dateKey, parseDate } from "./dates.js";
import { isActiveOnDate } from "./goals.js";

export function getStreak(goal, completions, todayKey) {
  let current = 0;
  let best = 0;
  let run = 0;
  const start = parseDate(goal.start);
  const end = parseDate(goal.end);
  const today = parseDate(todayKey);
  const final = end < today ? end : today;

  for (let day = start; day <= final; day = addDays(day, 1)) {
    const key = dateKey(day);
    if (!isActiveOnDate(goal, key)) continue;
    if (completions[goal.id]?.[key]) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  current = run;
  return { current, best };
}

export function countCompleted(goal, completions) {
  return Object.values(completions[goal.id] || {}).filter(Boolean).length;
}

export function getWeeklyCount(goal, completions, todayKey) {
  const today = parseDate(todayKey);
  let count = 0;
  for (let i = 0; i < 7; i += 1) {
    const key = dateKey(addDays(today, -i));
    if (isActiveOnDate(goal, key) && completions[goal.id]?.[key]) count += 1;
  }
  return count;
}
