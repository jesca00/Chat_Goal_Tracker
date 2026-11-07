const STORAGE_KEY = "your-goals-data-v1";

export function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Array.isArray(saved.goals)) return { goals: [], completions: {}, milestones: {}, notes: {} };
    return {
      goals: saved.goals.filter(goal => goal && typeof goal.id === "string"),
      completions: saved.completions && typeof saved.completions === "object" ? saved.completions : {},
      milestones: saved.milestones && typeof saved.milestones === "object" ? saved.milestones : {},
      notes: saved.notes && typeof saved.notes === "object" ? saved.notes : {}
    };
  } catch {
    return { goals: [], completions: {}, milestones: {}, notes: {} };
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportData(data) {
  const file = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = `your-goals-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function validateImport(value) {
  return value && value.version === 1 && Array.isArray(value.goals) &&
    value.completions && typeof value.completions === "object" &&
    value.milestones && typeof value.milestones === "object";
}
