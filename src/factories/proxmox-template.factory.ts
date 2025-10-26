import {loadProxmoxConfig} from '../config/proxmox.config.js'
import {ProxmoxApiRepository} from '../repositories/proxmox-api.repository.js'
import {ProxmoxTemplateService} from '../services/proxmox-template.service.js'

/**
 * Factory for creating Proxmox template service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ProxmoxTemplateFactory = {
  /**
   * Creates a fully-configured ProxmoxTemplateService instance.
   * Loads configuration from environment and wires all dependencies.
   * @returns ProxmoxTemplateService with all dependencies wired
   */
  createProxmoxTemplateService(): ProxmoxTemplateService {
    const config = loadProxmoxConfig()
    const repository = new ProxmoxApiRepository(config)
    return new ProxmoxTemplateService(repository)
  },
}
