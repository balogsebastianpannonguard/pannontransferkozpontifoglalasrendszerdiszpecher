/** Belépés utáni visszairányítás: csak az oldalon belüli, abszolút útvonal engedélyezett (nincs külső átirányítás). */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.startsWith("/login")) return null;
  return path.slice(0, 200);
}
