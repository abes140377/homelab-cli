import {z} from 'zod';

import {ProjectSchema} from './schemas/project.schema.js';

/**
 * Project Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ProjectDTO = z.infer<typeof ProjectSchema>;
