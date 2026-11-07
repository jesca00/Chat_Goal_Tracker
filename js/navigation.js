export function initNavigation(onChange) {
  document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-link").forEach(item => item.classList.toggle("active", item === button));
      onChange(button.dataset.page);
    });
  });
}

export function showPage(name) {
  document.querySelectorAll(".page").forEach(page => {
    page.hidden = page.id !== `${name}-page`;
  });
}
