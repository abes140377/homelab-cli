import {z} from 'zod';

import {ProjectContextSchema} from './project-context.schema.js';

/**
 * Zod schema for project validation.
 * Serves as the single source of truth for project data structure.
 */
export const ProjectSchema = z.object({
  contexts: z.array(ProjectContextSchema).optional(),
  createdAt: z.date(),
  id: z.string().min(1), // Support both PocketBase IDs (15 chars) and UUIDs
  name: z.string().min(1),
  updatedAt: z.date(),
});
