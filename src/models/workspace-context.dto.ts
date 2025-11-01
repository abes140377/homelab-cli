import {z} from 'zod';

import {WorkspaceContextSchema} from './schemas/workspace-context.schema.js';

/**
 * Workspace Context Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type WorkspaceContextDTO = z.infer<typeof WorkspaceContextSchema>;
