import { Product } from '@prisma/client';

export function effectiveStockUnits(p: Pick<Product, 'stock' | 'stockUnits'>): number {
  const su = typeof p.stockUnits === 'number' ? p.stockUnits : 0;
  const s = typeof p.stock === 'number' ? p.stock : 0;
  return su || s || 0;
}

export function canSellOnWeb(product: Pick<Product, 'status' | 'stock' | 'stockUnits'>): boolean {
  const stockUnits = effectiveStockUnits(product);
  return product.status === 'ACTIVE' && stockUnits > 0;
}

export function canSellOnERP(product: Pick<Product, 'stock' | 'stockUnits' | 'allowBackorder'>): boolean {
  const stockUnits = effectiveStockUnits(product);
  if (stockUnits > 0) return true;
  return product.allowBackorder === true;
}

export function isBackorder(product: Pick<Product, 'stock' | 'stockUnits' | 'allowBackorder'>): boolean {
  const stockUnits = effectiveStockUnits(product);
  return stockUnits === 0 && product.allowBackorder === true;
}

