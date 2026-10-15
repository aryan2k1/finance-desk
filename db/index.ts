import { env } from 'cloudflare:workers';
export function getRawDb(): D1Database { if (!env.DB) throw new Error('Storage temporarily unavailable'); return env.DB; }
export function runtimeEnv(): Record<string,unknown> { return env as unknown as Record<string,unknown>; }
