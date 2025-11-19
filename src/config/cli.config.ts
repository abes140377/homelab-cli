import Configstore from 'configstore'

import {CliConfig, CliConfigSchema} from '../models/schemas/cli-config.schema.js'

/**
 * Configuration manager for CLI settings using configstore
 * with environment variable override support
 */
export class CliConfigManager {
  private store: Configstore

  constructor(packageName: string = 'homelab-cli') {
    this.store = new Configstore(packageName, {})
  }

  /**
   * Get a configuration value with precedence:
   * 1. Environment variable (highest priority)
   * 2. Configstore (fallback)
   * 3. Schema defaults (lowest priority)
   */
  get<K extends keyof CliConfig>(key: K): CliConfig[K] {
    // 1. Check environment variable first
    const envValue = this.getFromEnv(key)
    if (envValue !== undefined) {
      return envValue
    }

    // 2. Check configstore
    const storeValue = this.store.get(key)
    if (storeValue !== undefined && storeValue !== null) {
      return storeValue as CliConfig[K]
    }

    // 3. Return default from schema
    return this.getDefault(key)
  }

  /**
   * Get all configuration values with precedence applied
   */
  getAll(): CliConfig {
    return {
      colorOutput: this.get('colorOutput'),
      logLevel: this.get('logLevel'),
    }
  }

  /**
   * Get the path to the config file
   */
  getPath(): string {
    return this.store.path
  }

  /**
   * Set a configuration value in configstore
   */
  set<K extends keyof CliConfig>(key: K, value: CliConfig[K]): void {
    this.store.set(key, value)
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnakeCase(str: string): string {
    return str.replaceAll(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  }

  /**
   * Get default value from schema
   */
  private getDefault<K extends keyof CliConfig>(key: K): CliConfig[K] {
    const defaults = CliConfigSchema.parse({})
    return defaults[key]
  }

  /**
   * Get configuration value from environment variable
   * Environment variables use HOMELAB_ prefix and uppercase key
   */
  private getFromEnv<K extends keyof CliConfig>(key: K): CliConfig[K] | undefined {
    // Convert camelCase to UPPER_SNAKE_CASE
    const envKey = `HOMELAB_${this.camelToSnakeCase(key).toUpperCase()}`
    const envValue = process.env[envKey]

    if (!envValue) {
      return undefined
    }

    // Type-specific parsing
    if (key === 'colorOutput') {
      return (envValue.toLowerCase() === 'true') as CliConfig[K]
    }

    return envValue as CliConfig[K]
  }
}

// Singleton instance
let instance: CliConfigManager | null = null

/**
 * Get the singleton CLI config manager instance
 */
export function getCliConfig(): CliConfigManager {
  if (!instance) {
    instance = new CliConfigManager()
  }

  return instance
}
