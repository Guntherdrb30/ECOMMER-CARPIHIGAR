export function generateToken(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export function validateToken(input: string, expected: string): boolean {
  return String(input || '').trim() === String(expected || '').trim();
}

