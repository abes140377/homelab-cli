import Configstore from 'configstore'
import {homedir} from 'node:os'
import {resolve} from 'node:path'

import {
  CliConfig,
  CliConfigSchema,
  ProxmoxConfig,
  ProxmoxConfigSchema,
} from '../models/schemas/cli-config.schema.js'

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
      // For projectsDir, expand ~ to absolute path
      if (key === 'projectsDir' && typeof storeValue === 'string') {
        return this.expandHomeDir(storeValue) as CliConfig[K]
      }

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
      projectsDir: this.get('projectsDir'),
      proxmox: this.get('proxmox'),
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
   * Expands ~ to the user's home directory if present in the path
   * @param filePath - The path to expand
   * @returns The expanded absolute path
   */
  private expandHomeDir(filePath: string): string {
    if (filePath.startsWith('~/') || filePath === '~') {
      return resolve(homedir(), filePath.slice(2))
    }

    return resolve(filePath)
  }

  /**
   * Get default value from schema
   */
  private getDefault<K extends keyof CliConfig>(key: K): CliConfig[K] {
    const defaults = CliConfigSchema.parse({})

    // For projectsDir, expand ~ to absolute path
    if (key === 'projectsDir') {
      return this.expandHomeDir(defaults[key] as string) as CliConfig[K]
    }

    return defaults[key]
  }

  /**
   * Get configuration value from environment variable
   * Environment variables use HOMELAB_ prefix and uppercase key
   */
  private getFromEnv<K extends keyof CliConfig>(key: K): CliConfig[K] | undefined {
    // Special handling for projectsDir (PROJECTS_DIR env var)
    if (key === 'projectsDir') {
      const projectsDir = process.env.PROJECTS_DIR
      if (projectsDir) {
        return this.expandHomeDir(projectsDir) as CliConfig[K]
      }

      return undefined
    }

    // Special handling for proxmox config
    if (key === 'proxmox') {
      return this.getProxmoxFromEnv() as CliConfig[K]
    }

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

  /**
   * Get Proxmox configuration from environment variables
   */
  private getProxmoxFromEnv(): ProxmoxConfig | undefined {
    const user = process.env.PROXMOX_USER
    const realm = process.env.PROXMOX_REALM
    const tokenKey = process.env.PROXMOX_TOKEN_KEY
    const tokenSecret = process.env.PROXMOX_TOKEN_SECRET
    const host = process.env.PROXMOX_HOST
    const portStr = process.env.PROXMOX_PORT
    const rejectUnauthorizedStr = process.env.PROXMOX_REJECT_UNAUTHORIZED

    // If no proxmox env vars are set, return undefined to fall through to configstore
    if (!user && !realm && !tokenKey && !tokenSecret && !host && !portStr && !rejectUnauthorizedStr) {
      return undefined
    }

    // Parse port if provided
    const port = portStr ? Number.parseInt(portStr, 10) : undefined

    // Parse rejectUnauthorized if provided
    const rejectUnauthorized =
      rejectUnauthorizedStr === undefined ? undefined : rejectUnauthorizedStr.toLowerCase() !== 'false'

    // Parse through schema to apply defaults for port and rejectUnauthorized
    const parsed = ProxmoxConfigSchema.parse({
      host,
      port,
      realm,
      rejectUnauthorized,
      tokenKey,
      tokenSecret,
      user,
    })

    return parsed
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
