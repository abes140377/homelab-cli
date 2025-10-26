import {loadProxmoxConfig} from '../config/proxmox.config.js'
import {ProxmoxRepository} from '../repositories/proxmox.repository.js'
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
    const repository = new ProxmoxRepository(config)
    return new ProxmoxTemplateService(repository)
  },
}
