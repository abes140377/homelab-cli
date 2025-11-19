import {z} from 'zod'

/**
 * Zod schema for project validation.
 * Serves as the single source of truth for project data structure.
 */
export const ProjectSchema = z.object({
  gitRepoUrl: z.string(), // Allow empty string for projects without remote
  name: z.string().min(1, 'Project name must not be empty'),
})
