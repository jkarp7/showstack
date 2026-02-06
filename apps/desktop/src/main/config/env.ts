/**
 * Environment Configuration Module
 *
 * Loads and validates environment variables for cloud services.
 * This module should be imported at the very start of the main process.
 *
 * Usage:
 *   import { loadEnv, config } from './config/env';
 *   loadEnv(); // Call once at app startup
 *   console.log(config.supabase.url); // Access config values
 */

import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { app } from 'electron';

/**
 * Cloud service configuration
 */
export interface CloudConfig {
  supabase: {
    url: string | undefined;
    anonKey: string | undefined;
    serviceRoleKey: string | undefined;
  };
  powersync: {
    url: string | undefined;
  };
  isConfigured: boolean;
}

/**
 * Application configuration
 */
export interface AppConfig {
  nodeEnv: 'development' | 'staging' | 'production';
  debugDatabase: boolean;
  debugPowerSync: boolean;
}

/**
 * Combined configuration object
 */
export interface Config extends CloudConfig {
  app: AppConfig;
}

// Singleton configuration object
let _config: Config | null = null;

/**
 * Load environment variables from .env file
 * Should be called once at application startup, before accessing config
 *
 * Searches for .env files in order:
 * 1. Project root (development)
 * 2. App resources directory (production)
 */
export function loadEnv(): void {
  // Already loaded
  if (_config !== null) {
    return;
  }

  // Determine paths to check for .env file
  const possiblePaths = [
    // Development: project root
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '.env.local'),
    // Production: app resources directory
    app.isPackaged ? resolve(app.getPath('userData'), '.env') : null,
  ].filter((p): p is string => p !== null);

  // Find first existing .env file
  const envPath = possiblePaths.find((p) => existsSync(p));

  if (envPath) {
    const result = dotenvConfig({ path: envPath });
    if (result.error) {
      console.warn('[ENV] Failed to load .env file:', result.error.message);
    } else {
      console.log('[ENV] Loaded environment from:', envPath);
    }
  } else {
    console.log('[ENV] No .env file found, using process environment only');
  }

  // Parse and validate configuration
  _config = parseConfig();
}

/**
 * Parse environment variables into typed configuration
 */
function parseConfig(): Config {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const powersyncUrl = process.env.POWERSYNC_URL;

  // Check if cloud services are configured
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey && powersyncUrl);

  return {
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceRoleKey: supabaseServiceRoleKey,
    },
    powersync: {
      url: powersyncUrl,
    },
    isConfigured,
    app: {
      nodeEnv: parseNodeEnv(process.env.NODE_ENV),
      debugDatabase: process.env.DEBUG_DATABASE === 'true',
      debugPowerSync: process.env.DEBUG_POWERSYNC === 'true',
    },
  };
}

/**
 * Parse NODE_ENV with fallback to 'development'
 */
function parseNodeEnv(value: string | undefined): 'development' | 'staging' | 'production' {
  if (value === 'production' || value === 'staging') {
    return value;
  }
  return 'development';
}

/**
 * Get the current configuration
 * Throws if loadEnv() hasn't been called
 */
export function getConfig(): Config {
  if (_config === null) {
    throw new Error('Configuration not loaded. Call loadEnv() first.');
  }
  return _config;
}

/**
 * Check if cloud services are configured
 * Safe to call before loadEnv() - returns false if not loaded
 */
export function isCloudConfigured(): boolean {
  return _config?.isConfigured ?? false;
}

/**
 * Validate that required cloud configuration is present
 * Throws descriptive error if missing
 */
export function requireCloudConfig(): void {
  const cfg = getConfig();

  const missing: string[] = [];

  if (!cfg.supabase.url) missing.push('SUPABASE_URL');
  if (!cfg.supabase.anonKey) missing.push('SUPABASE_ANON_KEY');
  if (!cfg.powersync.url) missing.push('POWERSYNC_URL');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please copy .env.example to .env and fill in your credentials.\n' +
        'See SUPABASE_SETUP_GUIDE.md for setup instructions.',
    );
  }
}

/**
 * For testing: reset configuration
 * @internal
 */
export function resetConfig(): void {
  _config = null;
}
