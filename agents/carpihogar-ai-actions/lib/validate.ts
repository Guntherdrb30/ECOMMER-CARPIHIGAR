export function sanitizeText(s: any, max = 500): string {
  const v = String(s ?? '').trim();
  return v.slice(0, max);
}

export function ensureId(id: any, name = 'id'): string {
  const v = String(id || '').trim();
  if (!v) throw new Error(`${name} requerido`);
  return v;
}

export function ensureQty(q: any): number {
  const n = Number(q);
  if (!Number.isFinite(n) || n <= 0) throw new Error('Cantidad inválida');
  return Math.floor(n);
}

export function ensureEmail(s: any): string {
  const v = sanitizeText(s, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new Error('Email inválido');
  return v;
}

export function ensurePhone(s: any): string {
  const v = sanitizeText(s, 40);
  if (!/[0-9+()\s-]{7,}/.test(v)) throw new Error('Teléfono inválido');
  return v;
}

