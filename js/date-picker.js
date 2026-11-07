import { addDays, dateKey, formatDate } from "./dates.js";

export function createDatePicker(container, initialDate, onSelect) {
  let visibleMonth = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  let selected = dateKey(initialDate);

  function render() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const today = dateKey(new Date());
    container.innerHTML = `
      <div class="picker-head">
        <button class="text-button" data-shift="-1" type="button" aria-label="Previous month">←</button>
        <strong>${formatDate(visibleMonth, { month: "long", year: "numeric" })}</strong>
        <button class="text-button" data-shift="1" type="button" aria-label="Next month">→</button>
      </div>
      <div class="picker-grid">
        ${["Su","Mo","Tu","We","Th","Fr","Sa"].map(day => `<span class="picker-weekday">${day}</span>`).join("")}
        ${Array.from({ length: firstDay }, () => "<span></span>").join("")}
        ${Array.from({ length: days }, (_, index) => {
          const date = new Date(year, month, index + 1);
          const key = dateKey(date);
          const classes = [key === selected ? "selected" : "", key === today ? "today" : ""].filter(Boolean).join(" ");
          return `<button type="button" data-date="${key}" class="${classes}" aria-label="${formatDate(date)}">${index + 1}</button>`;
        }).join("")}
      </div>`;
    container.querySelectorAll("[data-shift]").forEach(button => button.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() + Number(button.dataset.shift));
      render();
    }));
    container.querySelectorAll("[data-date]").forEach(button => button.addEventListener("click", () => {
      selected = button.dataset.date;
      onSelect(new Date(`${selected}T12:00:00`));
      container.hidden = true;
    }));
  }
  render();
  return { refresh(date) { selected = dateKey(date); visibleMonth = new Date(date.getFullYear(), date.getMonth(), 1); render(); } };
}
