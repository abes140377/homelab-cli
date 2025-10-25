import {z} from 'zod';

import {WorkspaceSchema} from './schemas/workspace.schema.js';

/**
 * Workspace Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type WorkspaceDTO = z.infer<typeof WorkspaceSchema>;
