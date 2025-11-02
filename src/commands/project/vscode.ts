import {Args} from '@oclif/core'

import {ProjectFactory} from '../../factories/project.factory.js'
import {BaseCommand} from '../../lib/base-command.js'
import {ProjectLauncherService} from '../../services/project-launcher.service.js'

export default class ProjectVscode extends BaseCommand<typeof ProjectVscode> {
  /* eslint-disable perfectionist/sort-objects */
  // Positional order must be projectName, then contextName - do not sort alphabetically
  static args = {
    projectName: Args.string({
      description: 'Name of the project',
      required: true,
    }),
    contextName: Args.string({
      description: 'Name of the context to open in VSCode',
      required: true,
    }),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'Open a project context in VSCode'
  static examples = [
    '<%= config.bin %> <%= command.id %> my-project backend',
    '<%= config.bin %> <%= command.id %> my-project frontend',
  ]

  async run(): Promise<void> {
    await this.parse(ProjectVscode)

    const {contextName, projectName} = this.args

    // Get project service and fetch project by name
    const service = ProjectFactory.createProjectService()
    const projectResult = await service.findProjectByName(projectName)

    if (!projectResult.success) {
      this.error(
        `Project '${projectName}' not found. Run 'homelab project list' to see available projects.`,
        {exit: 1},
      )
    }

    const project = projectResult.data
    const contexts = project.contexts || []

    // Validate project has contexts configured
    if (contexts.length === 0) {
      this.error(
        `No contexts found for project '${projectName}'. Please configure contexts in PocketBase.`,
        {exit: 1},
      )
    }

    // Find matching context
    const matchingContext = contexts.find((c) => c.name === contextName)

    if (!matchingContext) {
      const contextNames = contexts.map((c) => c.name).join(', ')
      this.error(
        `Context '${contextName}' not found for project '${projectName}'. Available contexts: ${contextNames}`,
        {exit: 1},
      )
    }

    // Create launcher service and launch VSCode
    const launcherService = new ProjectLauncherService()
    const launchResult = await launcherService.launchVSCode(projectName, contextName)

    if (!launchResult.success) {
      this.error(`Failed to launch VSCode: ${launchResult.error.message}`, {exit: 1})
    }

    this.log(`Opened project '${projectName}' with context '${contextName}' in VSCode`)
  }
}
