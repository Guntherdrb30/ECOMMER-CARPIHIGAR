type Level = 'debug'|'info'|'warn'|'error';

export function log(event: string, payload?: any, level: Level = 'info') {
  const entry = { ts: new Date().toISOString(), level, event, ...(payload || {}) };
  try {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  } catch {
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${event}`);
  }
}

