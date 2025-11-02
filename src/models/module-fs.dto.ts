import {z} from 'zod'

import {ModuleFsSchema} from './schemas/module-fs.schema.js'

/**
 * Filesystem-based Module Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ModuleFsDto = z.infer<typeof ModuleFsSchema>
