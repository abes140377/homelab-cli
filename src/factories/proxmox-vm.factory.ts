import {loadProxmoxConfig} from '../config/proxmox.config.js'
import {ProxmoxApiRepository} from '../repositories/proxmox-api.repository.js'
import {ProxmoxVMService} from '../services/proxmox-vm.service.js'

/**
 * Factory for creating Proxmox VM service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ProxmoxVMFactory = {
  /**
   * Creates a fully-configured ProxmoxVMService instance.
   * Loads configuration from environment and wires all dependencies.
   * @returns ProxmoxVMService with all dependencies wired
   */
  createProxmoxVMService(): ProxmoxVMService {
    const config = loadProxmoxConfig()
    const repository = new ProxmoxApiRepository(config)
    return new ProxmoxVMService(repository)
  },
}
