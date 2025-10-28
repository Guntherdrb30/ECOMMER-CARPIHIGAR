export function normalizeVePhone(input: string): string | null {
  if (!input) return null;
  const digits = String(input).replace(/[^0-9]/g, '');
  if (!digits) return null;
  // Take last 10 digits as national number when possible
  let national = '';
  if (digits.startsWith('58')) {
    national = digits.slice(2);
  } else if (digits.startsWith('0')) {
    national = digits.slice(1);
  } else {
    national = digits;
  }
  // Pad/truncate to 10 (typical VE national length: 3-digit area + 7)
  if (national.length < 10) return null;
  national = national.slice(-10);
  const intl = '58' + national; // store as digits with country code, no plus
  // Final sanity check
  if (!/^58\d{10}$/.test(intl)) return null;
  return intl;
}

export function prettyVePhone(input: string): string {
  const n = normalizeVePhone(input);
  if (!n) return input;
  // Format as +58 0XXX-XXXXXXX style
  // Convert 58XXXXXXXXXX -> 0XXX-XXXXXXX
  const national = '0' + n.slice(2); // 0 + ten digits
  return `+58 ${national.slice(0,4)}-${national.slice(4)}`;
}

