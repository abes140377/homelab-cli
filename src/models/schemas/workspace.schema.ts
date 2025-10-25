import {z} from 'zod';

/**
 * Zod schema for workspace validation.
 * Serves as the single source of truth for workspace data structure.
 */
export const WorkspaceSchema = z.object({
  createdAt: z.date(),
  id: z.string().uuid(),
  name: z.string().min(1),
  updatedAt: z.date(),
});
