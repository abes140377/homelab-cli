import {z} from 'zod';

/**
 * Zod schema for project context validation.
 * Serves as the single source of truth for project context data structure.
 */
export const ProjectContextSchema = z.object({
  createdAt: z.date(),
  id: z.string().min(1),
  name: z.string().min(1),
  updatedAt: z.date(),
});
