export function formatKurus(kurus: number): string {
  const abs = Math.trunc(Math.abs(kurus));
  const lira = Math.trunc(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  const grouped = lira.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${fraction} ₺`;
}
