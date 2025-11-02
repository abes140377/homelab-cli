import {z} from 'zod'

/**
 * Zod schema for filesystem-based module validation.
 * Serves as the single source of truth for module data structure from filesystem.
 */
export const ModuleFsSchema = z.object({
  gitRepoUrl: z.string(), // Allow empty string for modules without remote
  name: z.string().min(1, 'Module name must not be empty'),
})
