export function showNotification(
  message: string,
  type: "success" | "error" | "warning" | "info"
): void {
  const container = document.getElementById("notifications");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
