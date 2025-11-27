import {homedir} from 'node:os'
import {resolve} from 'node:path'
import {z} from 'zod'

import {ProjectsDirConfigSchema} from './schemas/projects-dir.schema.js'

export type ProjectsDirConfig = z.infer<typeof ProjectsDirConfigSchema>

/**
 * Expands ~ to the user's home directory if present in the path
 * @param filePath - The path to expand
 * @returns The expanded absolute path
 */
function expandHomeDir(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return resolve(homedir(), filePath.slice(2))
  }

  return resolve(filePath)
}

/**
 * Loads and validates the projects directory configuration from environment variables.
 * @returns ProjectsDirConfig with validated projectsDir
 * @throws Error if validation fails
 */
export function loadProjectsDirConfig(): ProjectsDirConfig {
  const projectsDir = process.env.PROJECTS_DIR || '~/projects/'

  // Expand ~ to absolute path
  const expandedPath = expandHomeDir(projectsDir)

  const result = ProjectsDirConfigSchema.safeParse({
    projectsDir: expandedPath,
  })

  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(', ')

    throw new Error(`Invalid projects directory configuration: ${errors}`)
  }

  return result.data
}
