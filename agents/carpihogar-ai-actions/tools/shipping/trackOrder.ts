export async function run(input: { carrier?: string; tracking?: string }) {
  const carrier = String(input?.carrier || '').toUpperCase();
  const tracking = String(input?.tracking || '').trim();
  if (!carrier || !tracking) return { success: false, message: 'carrier y tracking requeridos', data: null };
  // Placeholder integration
  return { success: false, message: 'Tracking no implementado (MRW/Tealca)', data: null };
}

