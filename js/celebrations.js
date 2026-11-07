export function showCelebration(title, message) {
  const dialog = document.querySelector("#celebration-dialog");
  document.querySelector("#celebration-title").textContent = title;
  document.querySelector("#celebration-message").textContent = message;
  const confetti = document.querySelector(".confetti");
  confetti.replaceChildren();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 28; i += 1) {
      const piece = document.createElement("i");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDelay = `${Math.random() * 450}ms`;
      confetti.append(piece);
    }
  }
  dialog.showModal();
}
