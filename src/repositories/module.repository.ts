import {access, readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'

import type {ProjectsDirConfig} from '../config/projects-dir.config.js'
import type {ModuleDto} from '../models/module.dto.js'
import type {IModuleRepository} from './interfaces/module.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ModuleSchema} from '../models/schemas/module.schema.js'
import {CommandExecutorService} from '../services/command-executor.service.js'
import {logDebugError} from '../utils/debug-logger.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Module repository implementation using filesystem.
 * Scans a project's src directory for Git repositories and treats them as modules.
 */
export class ModuleRepository implements IModuleRepository {
  private commandExecutor: CommandExecutorService
  private config: ProjectsDirConfig

  constructor(config: ProjectsDirConfig, commandExecutor?: CommandExecutorService) {
    this.config = config
    this.commandExecutor = commandExecutor ?? new CommandExecutorService()
  }

  /**
   * Retrieves all Git repositories from a project's src directory.
   * Only scans direct subdirectories (no recursion).
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or a RepositoryError
   */
  async findByProjectName(projectName: string): Promise<Result<ModuleDto[], RepositoryError>> {
    try {
      const projectSrcDir = join(this.config.projectsDir, projectName, 'src')

      // Check if project src directory exists
      try {
        await access(projectSrcDir)
      } catch {
        return failure(
          new RepositoryError(`Project src directory not found: ${projectSrcDir}`, {
            context: {
              projectName,
              projectSrcDir,
            },
          }),
        )
      }

      // Verify it's a directory
      const srcStats = await stat(projectSrcDir)
      if (!srcStats.isDirectory()) {
        return failure(
          new RepositoryError(`Path is not a directory: ${projectSrcDir}`, {
            context: {
              projectName,
              projectSrcDir,
            },
          }),
        )
      }

      // Read all entries in the src directory
      const entries = await readdir(projectSrcDir, {withFileTypes: true})

      // Filter for directories only (exclude hidden directories)
      const directories = entries.filter(
        (entry) => entry.isDirectory() && !entry.name.startsWith('.'),
      )

      // Check which directories are Git repositories and create DTOs
      const moduleResults = await Promise.all(
        directories.map(async (dir) => {
          const dirPath = join(projectSrcDir, dir.name)
          const isGit = await this.isGitRepository(dirPath)
          if (!isGit) {
            return null
          }

          return this.createModuleDto(dirPath, dir.name)
        }),
      )

      // Filter out null values (non-git directories) and unwrap Results
      const modules: ModuleDto[] = []
      for (const result of moduleResults) {
        if (result === null) continue

        if (result.success) {
          modules.push(result.data)
        }
        // Silently skip modules where we couldn't get the git remote URL
      }

      return success(modules)
    } catch (error) {
      logDebugError('Filesystem error during findByProjectName (modules)', error, {
        projectName,
        projectSrcDir: join(this.config.projectsDir, projectName, 'src'),
      })

      return failure(
        new RepositoryError(
          `Failed to list modules from filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              message: error instanceof Error ? error.message : String(error),
              projectName,
            },
          },
        ),
      )
    }
  }

  /**
   * Creates a ModuleDto from a directory path
   * @param dirPath - The absolute path to the module directory
   * @param name - The directory name
   * @returns A validated ModuleDto wrapped in a Result
   */
  private async createModuleDto(
    dirPath: string,
    name: string,
  ): Promise<Result<ModuleDto, RepositoryError>> {
    try {
      const gitRepoUrl = await this.getGitRemoteUrl(dirPath)

      const moduleData = {
        gitRepoUrl,
        name,
      }

      const validated = ModuleSchema.parse(moduleData)
      return success(validated)
    } catch (error) {
      logDebugError('Error creating module DTO', error, {
        dirPath,
        name,
      })

      return failure(
        new RepositoryError(
          `Failed to create module DTO for '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              dirPath,
              name,
            },
          },
        ),
      )
    }
  }

  /**
   * Gets the Git remote URL (origin) for a repository
   * @param dirPath - The absolute path to the Git repository
   * @returns The remote URL or empty string if not found
   */
  private async getGitRemoteUrl(dirPath: string): Promise<string> {
    const result = await this.commandExecutor.executeCommand(
      'git',
      ['remote', 'get-url', 'origin'],
      {cwd: dirPath},
    )

    if (!result.success || !result.data.stdout) {
      // Return empty string if git remote doesn't exist
      return ''
    }

    return result.data.stdout.trim()
  }

  /**
   * Checks if a directory is a Git repository by looking for .git subdirectory
   * @param dirPath - The directory path to check
   * @returns true if .git exists and is a directory, false otherwise
   */
  private async isGitRepository(dirPath: string): Promise<boolean> {
    try {
      const gitPath = join(dirPath, '.git')
      const stats = await stat(gitPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  }
}
