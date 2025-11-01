import {z} from 'zod';

import {WorkspaceContextSchema} from './workspace-context.schema.js';

/**
 * Zod schema for workspace validation.
 * Serves as the single source of truth for workspace data structure.
 */
export const WorkspaceSchema = z.object({
  contexts: z.array(WorkspaceContextSchema).optional(),
  createdAt: z.date(),
  id: z.string().min(1), // Support both PocketBase IDs (15 chars) and UUIDs
  name: z.string().min(1),
  updatedAt: z.date(),
});
