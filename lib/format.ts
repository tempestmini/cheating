export function formatDocDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    const h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, "0");
    return `오늘 ${h}:${m}`;
  }
  const y = date.getFullYear();
  const mo = date.getMonth() + 1;
  const d = date.getDate();
  const h = date.getHours().toString().padStart(2, "0");
  const mi = date.getMinutes().toString().padStart(2, "0");
  return `${y}. ${mo}. ${d}. ${h}:${mi}`;
}
