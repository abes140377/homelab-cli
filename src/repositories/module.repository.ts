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
   * Scans recursively through all subdirectories.
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

      // Recursively scan for Git repositories
      const gitDirectories = await this.scanDirectoryRecursively(projectSrcDir)

      // Create module DTOs for each Git repository
      const moduleResults = await Promise.all(
        gitDirectories.map(async (dirPath) => {
          const name = this.getModuleName(dirPath, projectSrcDir)
          return this.createModuleDto(dirPath, name)
        }),
      )

      // Filter out failed results and collect successful modules
      const modules: ModuleDto[] = []
      for (const result of moduleResults) {
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
   * Generates a module name from its path relative to the project src directory.
   * Uses the relative path with forward slashes as the module name.
   * @param modulePath - The absolute path to the module
   * @param projectSrcDir - The absolute path to the project's src directory
   * @returns The module name (relative path from src directory)
   */
  private getModuleName(modulePath: string, projectSrcDir: string): string {
    // Get relative path from src directory
    const relativePath = modulePath.slice(projectSrcDir.length + 1)
    // Normalize path separators to forward slashes
    return relativePath.split(/[\\/]/).join('/')
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

  /**
   * Recursively scans a directory for Git repositories.
   * Stops scanning subdirectories once a Git repository is found.
   * @param dirPath - The directory path to scan
   * @returns Array of absolute paths to Git repositories
   */
  private async scanDirectoryRecursively(dirPath: string): Promise<string[]> {
    const gitRepos: string[] = []

    try {
      // Check if current directory is a Git repository
      const isGit = await this.isGitRepository(dirPath)
      if (isGit) {
        // Found a Git repository, add it and don't scan subdirectories
        gitRepos.push(dirPath)
        return gitRepos
      }

      // Read all entries in the directory
      const entries = await readdir(dirPath, {withFileTypes: true})

      // Filter for directories only (exclude hidden directories)
      const directories = entries.filter(
        (entry) => entry.isDirectory() && !entry.name.startsWith('.'),
      )

      // Recursively scan each subdirectory in parallel
      const scanResults = await Promise.all(
        directories.map(async (dir) => {
          const subDirPath = join(dirPath, dir.name)
          return this.scanDirectoryRecursively(subDirPath)
        }),
      )

      // Flatten results
      for (const subDirRepos of scanResults) {
        gitRepos.push(...subDirRepos)
      }
    } catch (error) {
      // Silently skip directories we can't access (permissions, etc.)
      logDebugError('Error scanning directory', error, {dirPath})
    }

    return gitRepos
  }
}
