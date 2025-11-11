export type Missing = { needQuantity?: boolean; needAddress?: boolean; needConfirmation?: boolean };

export function detectMissing({ items, addressId, quantity }: { items?: any[]; addressId?: string; quantity?: number }): Missing {
  const m: Missing = {};
  if (!Array.isArray(items) || !items.length || !quantity) m.needQuantity = true;
  if (!addressId) m.needAddress = true;
  return m;
}
