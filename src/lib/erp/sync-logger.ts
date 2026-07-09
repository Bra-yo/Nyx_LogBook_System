export interface SyncLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export class ConsoleSyncLogger implements SyncLogger {
  info(message: string, context?: Record<string, unknown>) {
    console.info(`[erp-sync] ${message}`, context ?? {});
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[erp-sync] ${message}`, context ?? {});
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error(`[erp-sync] ${message}`, context ?? {});
  }
}
