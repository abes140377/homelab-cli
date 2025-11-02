import {createHash} from 'node:crypto'
import {access, readdir, stat} from 'node:fs/promises'
import {join} from 'node:path'

import type {ProjectsDirConfig} from '../config/projects-dir.config.js'
import type {ProjectDTO} from '../models/project.dto.js'
import type {IProjectRepository} from './interfaces/project.repository.interface.js'

import {RepositoryError} from '../errors/repository.error.js'
import {ProjectSchema} from '../models/schemas/project.schema.js'
import {failure, type Result, success} from '../utils/result.js'

/**
 * Project repository implementation using filesystem.
 * Scans a directory for Git repositories and treats them as projects.
 */
export class ProjectFsRepository implements IProjectRepository {
  private config: ProjectsDirConfig

  constructor(config: ProjectsDirConfig) {
    this.config = config
  }

  /**
   * Retrieves all Git repositories from the configured projects directory.
   * Only scans direct subdirectories (no recursion).
   * @returns Result containing array of projects or a RepositoryError
   */
  async findAll(): Promise<Result<ProjectDTO[], RepositoryError>> {
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
      const gitChecks = await Promise.all(
        directories.map(async (dir) => {
          const dirPath = join(this.config.projectsDir, dir.name)
          const isGit = await this.isGitRepository(dirPath)
          return {dir, dirPath, isGit}
        }),
      )

      const projects = gitChecks
        .filter((check) => check.isGit)
        .map((check) => this.createProjectDto(check.dirPath, check.dir.name))

      return success(projects)
    } catch (error) {
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
  async findByName(name: string): Promise<Result<ProjectDTO, RepositoryError>> {
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

      const project = this.createProjectDto(dirPath, name)
      return success(project)
    } catch (error) {
      // Handle specific ENOENT error (file/directory not found)
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
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
   * Creates a ProjectDTO from a directory path
   * @param dirPath - The absolute path to the project directory
   * @param name - The directory name
   * @returns A validated ProjectDTO
   */
  private createProjectDto(dirPath: string, name: string): ProjectDTO {
    const now = new Date()
    const projectData = {
      createdAt: now,
      id: this.generateId(dirPath),
      name,
      updatedAt: now,
    }

    return ProjectSchema.parse(projectData)
  }

  /**
   * Generates a deterministic ID from a path using SHA-256 hash
   * @param path - The absolute path to hash
   * @returns A hex string representing the hash
   */
  private generateId(path: string): string {
    return createHash('sha256').update(path).digest('hex').slice(0, 15)
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
