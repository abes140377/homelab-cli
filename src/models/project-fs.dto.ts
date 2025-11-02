import {z} from 'zod'

import {ProjectFsSchema} from './schemas/project-fs.schema.js'

/**
 * Filesystem-based Project Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ProjectFsDto = z.infer<typeof ProjectFsSchema>
