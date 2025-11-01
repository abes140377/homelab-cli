import {loadPocketBaseConfig} from '../config/pocketbase.config.js';
import {ModuleRepository} from '../repositories/module.repository.js';
import {ModuleService} from '../services/module.service.js';

/**
 * Factory for creating module service instances with dependencies.
 * Centralizes dependency composition and configuration.
 */
export const ModuleFactory = {
  /**
   * Creates a fully-configured ModuleService instance.
   * @returns ModuleService with all dependencies wired
   */
  createModuleService(): ModuleService {
    const config = loadPocketBaseConfig();
    const repository = new ModuleRepository(config);
    return new ModuleService(repository);
  },
};
