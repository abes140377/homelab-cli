import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {ModuleRepository} from '../repositories/module.repository.js'
import {ModuleService} from '../services/module.service.js'

/**
 * Factory for creating module service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ModuleFactory = {
  /**
   * Creates a fully-configured ModuleService instance.
   * @returns ModuleService with repository dependencies wired
   */
  createModuleService(): ModuleService {
    const config = loadProjectsDirConfig()
    const repository = new ModuleRepository(config)
    return new ModuleService(repository)
  },
}
