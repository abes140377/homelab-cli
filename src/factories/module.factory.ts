import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {ModuleFsRepository} from '../repositories/module-fs.repository.js'
import {ModuleFsService} from '../services/module-fs.service.js'

/**
 * Factory for creating module service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ModuleFactory = {
  /**
   * Creates a fully-configured ModuleFsService instance using filesystem.
   * @returns ModuleFsService with filesystem repository dependencies wired
   */
  createModuleFsService(): ModuleFsService {
    const config = loadProjectsDirConfig()
    const repository = new ModuleFsRepository(config)
    return new ModuleFsService(repository)
  },
}
