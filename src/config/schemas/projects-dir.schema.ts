import {z} from 'zod'

export const ProjectsDirConfigSchema = z.object({
  projectsDir: z.string().min(1, 'PROJECTS_DIR must not be empty'),
})
