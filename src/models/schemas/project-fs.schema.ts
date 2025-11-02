import {z} from 'zod'

/**
 * Zod schema for filesystem-based project validation.
 * Serves as the single source of truth for project data structure from filesystem.
 */
export const ProjectFsSchema = z.object({
  gitRepoUrl: z.string(), // Allow empty string for projects without remote
  name: z.string().min(1, 'Project name must not be empty'),
})
