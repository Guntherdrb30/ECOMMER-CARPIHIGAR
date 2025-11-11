export function selectProvider({ city, weightKg, volume }: { city?: string; weightKg?: number; volume?: number }): 'mrw'|'tealca'|'interno' {
  const c = String(city || '').toLowerCase();
  if (!c) return 'mrw';
  if (/barinas|mismo/i.test(c)) return 'interno';
  if (/caracas|valencia|maracay|barquisimeto|maracaibo/.test(c)) return 'mrw';
  return 'tealca';
}
