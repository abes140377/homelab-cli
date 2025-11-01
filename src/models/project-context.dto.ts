import {z} from 'zod';

import {ProjectContextSchema} from './schemas/project-context.schema.js';

/**
 * Project Context Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ProjectContextDTO = z.infer<typeof ProjectContextSchema>;
