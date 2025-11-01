import {z} from 'zod';

/**
 * Zod schema for workspace context validation.
 * Serves as the single source of truth for workspace context data structure.
 */
export const WorkspaceContextSchema = z.object({
  createdAt: z.date(),
  id: z.string().min(1),
  name: z.string().min(1),
  updatedAt: z.date(),
});
