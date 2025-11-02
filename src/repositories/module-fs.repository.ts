import {exec} from 'node:child_process'
import {access, readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'
import {promisify} from 'node:util'

import type {ProjectsDirConfig} from '../config/projects-dir.config.js'
import type {ModuleFsDto} from '../models/module-fs.dto.js'
import type {IModuleFsRepository} from './interfaces/module-fs.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ModuleFsSchema} from '../models/schemas/module-fs.schema.js'
import {failure, type Result, success} from '../utils/result.js'

const execAsync = promisify(exec)

/**
 * Module repository implementation using filesystem.
 * Scans a project's src directory for Git repositories and treats them as modules.
 */
export class ModuleFsRepository implements IModuleFsRepository {
  private config: ProjectsDirConfig

  constructor(config: ProjectsDirConfig) {
    this.config = config
  }

  /**
   * Retrieves all Git repositories from a project's src directory.
   * Only scans direct subdirectories (no recursion).
   * @param projectName - The name of the project to find modules for
   * @returns Result containing array of modules or a RepositoryError
   */
  async findByProjectName(projectName: string): Promise<Result<ModuleFsDto[], RepositoryError>> {
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
      const modules: ModuleFsDto[] = []
      for (const result of moduleResults) {
        if (result === null) continue

        if (result.success) {
          modules.push(result.data)
        }
        // Silently skip modules where we couldn't get the git remote URL
      }

      return success(modules)
    } catch (error) {
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
   * Creates a ModuleFsDto from a directory path
   * @param dirPath - The absolute path to the module directory
   * @param name - The directory name
   * @returns A validated ModuleFsDto wrapped in a Result
   */
  private async createModuleDto(
    dirPath: string,
    name: string,
  ): Promise<Result<ModuleFsDto, RepositoryError>> {
    try {
      const gitRepoUrl = await this.getGitRemoteUrl(dirPath)

      const moduleData = {
        gitRepoUrl,
        name,
      }

      const validated = ModuleFsSchema.parse(moduleData)
      return success(validated)
    } catch (error) {
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
    try {
      const {stdout} = await execAsync('git remote get-url origin', {
        cwd: dirPath,
        encoding: 'utf8',
      })

      return stdout.trim()
    } catch {
      // Return empty string if git remote doesn't exist
      return ''
    }
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
