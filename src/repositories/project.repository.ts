import {access, readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'

import type {ProjectsDirConfig} from '../config/projects-dir.config.js'
import type {ProjectDto} from '../models/project.dto.js'
import type {IProjectRepository} from './interfaces/project.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ProjectSchema} from '../models/schemas/project.schema.js'
import {CommandExecutorService} from '../services/command-executor.service.js'
import {logDebugError} from '../utils/debug-logger.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Project repository implementation using filesystem.
 * Scans a directory for Git repositories and treats them as projects.
 */
export class ProjectRepository implements IProjectRepository {
  private commandExecutor: CommandExecutorService
  private config: ProjectsDirConfig

  constructor(config: ProjectsDirConfig, commandExecutor?: CommandExecutorService) {
    this.config = config
    this.commandExecutor = commandExecutor ?? new CommandExecutorService()
  }

  /**
   * Retrieves all Git repositories from the configured projects directory.
   * Only scans direct subdirectories (no recursion).
   * @returns Result containing array of projects or a RepositoryError
   */
  async findAll(): Promise<Result<ProjectDto[], RepositoryError>> {
    try {
      // Check if projects directory exists
      await access(this.config.projectsDir)

      // Read all entries in the directory
      const entries = await readdir(this.config.projectsDir, {withFileTypes: true})

      // Filter for directories only (exclude hidden directories)
      const directories = entries.filter(
        (entry) => entry.isDirectory() && !entry.name.startsWith('.'),
      )

      // Check which directories are Git repositories and create DTOs
      const projectResults = await Promise.all(
        directories.map(async (dir) => {
          const dirPath = join(this.config.projectsDir, dir.name)
          const isGit = await this.isGitRepository(dirPath)
          if (!isGit) {
            return null
          }

          return this.createProjectDto(dirPath, dir.name)
        }),
      )

      // Filter out null values (non-git directories) and unwrap Results
      const projects: ProjectDto[] = []
      for (const result of projectResults) {
        if (result === null) continue

        if (result.success) {
          projects.push(result.data)
        }
        // Silently skip projects where we couldn't get the git remote URL
      }

      return success(projects)
    } catch (error) {
      logDebugError('Filesystem error during findAll (projects)', error, {
        projectsDir: this.config.projectsDir,
      })

      return failure(
        new RepositoryError(
          `Failed to list projects from filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              message: error instanceof Error ? error.message : String(error),
              projectsDir: this.config.projectsDir,
            },
          },
        ),
      )
    }
  }

  /**
   * Retrieves a single project by name from the configured projects directory.
   * Checks if the directory exists and is a Git repository.
   * @param name - The name of the project (directory name) to find
   * @returns Result containing the project or a RepositoryError
   */
  async findByName(name: string): Promise<Result<ProjectDto, RepositoryError>> {
    try {
      const dirPath = join(this.config.projectsDir, name)

      // Check if directory exists
      await access(dirPath)
      const stats = await stat(dirPath)

      if (!stats.isDirectory()) {
        return failure(
          new RepositoryError(`'${name}' is not a directory`, {
            context: {
              name,
              path: dirPath,
            },
          }),
        )
      }

      // Check if it's a Git repository
      if (!(await this.isGitRepository(dirPath))) {
        return failure(
          new RepositoryError(
            `Project '${name}' is not a Git repository (no .git directory found)`,
            {
              context: {
                name,
                path: dirPath,
              },
            },
          ),
        )
      }

      return this.createProjectDto(dirPath, name)
    } catch (error) {
      // Handle specific ENOENT error (file/directory not found)
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logDebugError('Filesystem error during findByName (project not found)', error, {
          name,
          path: join(this.config.projectsDir, name),
          projectsDir: this.config.projectsDir,
        })

        return failure(
          new RepositoryError(`Project '${name}' not found`, {
            cause: error,
            context: {
              name,
              path: join(this.config.projectsDir, name),
            },
          }),
        )
      }

      logDebugError('Filesystem error during findByName', error, {
        name,
        projectsDir: this.config.projectsDir,
      })

      return failure(
        new RepositoryError(
          `Failed to fetch project from filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {
            cause: error instanceof Error ? error : undefined,
            context: {
              message: error instanceof Error ? error.message : String(error),
              name,
            },
          },
        ),
      )
    }
  }

  /**
   * Creates a ProjectDto from a directory path
   * @param dirPath - The absolute path to the project directory
   * @param name - The directory name
   * @returns A validated ProjectDto wrapped in a Result
   */
  private async createProjectDto(
    dirPath: string,
    name: string,
  ): Promise<Result<ProjectDto, RepositoryError>> {
    try {
      const gitRepoUrl = await this.getGitRemoteUrl(dirPath)

      const projectData = {
        gitRepoUrl,
        name,
      }

      const validated = ProjectSchema.parse(projectData)
      return success(validated)
    } catch (error) {
      logDebugError('Error creating project DTO', error, {
        dirPath,
        name,
      })

      return failure(
        new RepositoryError(
          `Failed to create project DTO for '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`,
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
