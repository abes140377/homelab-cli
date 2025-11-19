import {z} from 'zod'

/**
 * Zod schema for module validation.
 * Serves as the single source of truth for module data structure.
 */
export const ModuleSchema = z.object({
  gitRepoUrl: z.string(), // Allow empty string for modules without remote
  name: z.string().min(1, 'Module name must not be empty'),
})
