import {getCliConfig} from '../config/cli.config.js'
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
    const cliConfig = getCliConfig()
    const config = {projectsDir: cliConfig.get('projectsDir')}
    const repository = new ModuleRepository(config)
    return new ModuleService(repository)
  },
}
