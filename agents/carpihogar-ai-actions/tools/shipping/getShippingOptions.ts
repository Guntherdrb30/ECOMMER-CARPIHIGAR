import { log } from '../../lib/logger';

export async function run(input: { city?: string }) {
  const city = String(input?.city || '').trim();
  const local = /barinas/i.test(city);
  const options = local
    ? [ { code: 'RETIRO_TIENDA', name: 'Retiro en tienda', priceUSD: 0 }, { code: 'DELIVERY_LOCAL', name: 'Delivery (incluido)', priceUSD: 0 } ]
    : [ { code: 'MRW', name: 'MRW (estimado)', priceUSD: 8 }, { code: 'TEALCA', name: 'Tealca (estimado)', priceUSD: 9 } ];
  log('mcp.shipping.options', { city, count: options.length });
  return { success: true, message: 'OK', data: { city, options } };
}

