export function isStrongPassword(password: string): boolean {
  const value = String(password || "").trim();
  if (!value) return false;
  const hasNumber = /\d/.test(value);
  return value.length >= 8 && hasNumber;
}

