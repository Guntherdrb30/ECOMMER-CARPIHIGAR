export async function run(input: { city?: string; date?: string }) {
  const city = String(input?.city || '').trim();
  const base = new Date(input?.date || Date.now());
  const days = /barinas/i.test(city) ? 1 : 3;
  const eta = new Date(base.getTime());
  eta.setDate(eta.getDate() + days);
  return { success: true, message: 'OK', data: { eta: eta.toISOString(), days } };
}

