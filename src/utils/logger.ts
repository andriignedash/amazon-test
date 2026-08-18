type LogDetails = Record<string, unknown>;

function write(
  level: 'INFO' | 'WARN' | 'ERROR',
  message: string,
  details?: LogDetails,
): void {
  const suffix = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[${level}] ${message}${suffix}`);
}

export const logger = {
  info(message: string, details?: LogDetails): void {
    write('INFO', message, details);
  },
  warn(message: string, details?: LogDetails): void {
    write('WARN', message, details);
  },
  error(message: string, details?: LogDetails): void {
    write('ERROR', message, details);
  },
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
