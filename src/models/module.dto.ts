import {z} from 'zod'

import {ModuleSchema} from './schemas/module.schema.js'

/**
 * Module Data Transfer Object.
 * Type is inferred from the Zod schema to ensure consistency.
 */
export type ModuleDto = z.infer<typeof ModuleSchema>
