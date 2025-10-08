export function computeEan13CheckDigit(first12: string): string {
  const digits = first12.replace(/\D/g, '').padStart(12, '0').slice(-12).split('').map((d) => parseInt(d, 10));
  let sumOdd = 0; // positions 1,3,5,... (0-indexed even)
  let sumEven = 0; // positions 2,4,6,... (0-indexed odd)
  for (let i = 0; i < digits.length; i++) {
    if (i % 2 === 0) sumOdd += digits[i];
    else sumEven += digits[i];
  }
  const total = sumOdd + sumEven * 3;
  const mod = total % 10;
  const check = mod === 0 ? 0 : 10 - mod;
  return String(check);
}

export function normalizeBarcode(input?: string | null): string | undefined {
  const s = String(input || '').replace(/\D/g, '');
  if (!s) return undefined;
  // If 12 digits, append EAN-13 check digit
  if (s.length === 12) return s + computeEan13CheckDigit(s);
  if (s.length === 13) return s;
  // allow EAN-8 by zero-padding to 13 for internal use
  if (s.length === 8) return s.padStart(13, '0');
  // otherwise return undefined
  return undefined;
}

export function randomDigits(n: number): string {
  let out = '';
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10);
  return out;
}

// Generate an internal EAN-13 starting with 200 (store internal range)
export function generateEan13(prefix: string = '200'): string {
  const p = (prefix || '').replace(/\D/g, '').slice(0, 3) || '200';
  const body = p + randomDigits(9); // 12 digits total
  const cd = computeEan13CheckDigit(body);
  return body + cd;
}

