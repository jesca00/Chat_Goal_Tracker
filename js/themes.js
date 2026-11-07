const THEME_KEY = "your-goals-theme";

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
  document.querySelector("#theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector("#theme-icon").textContent = theme === "dark" ? "☀" : "☾";
  document.querySelector('meta[name="theme-color"]').content = theme === "dark" ? "#1A000D" : "#FFE6F2";
}
