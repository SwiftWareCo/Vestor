/**
 * Environment variable validation helpers
 * Server-side only - do not import in client components
 */

/**
 * Get a required environment variable or throw a clear error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Please add it to your .env or .env.local file.`
    );
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
export function getOptionalEnv(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

/**
 * Database URL - required for all database operations
 */
export function getDatabaseUrl(): string {
  return getRequiredEnv('DATABASE_URL');
}
