export function log(event: string, meta?: Record<string, any>) {
  try {
    const payload = { ts: new Date().toISOString(), event, ...(meta || {}) };
    console.log(JSON.stringify(payload));
  } catch (e) {
    console.log(`[log:${event}]`, meta);
  }
}

