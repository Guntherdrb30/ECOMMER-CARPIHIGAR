export function isStrongPassword(password: string): boolean {
  const value = String(password || "").trim();
  if (!value) return false;
  return value.length >= 8 && value.length <= 16;
}
