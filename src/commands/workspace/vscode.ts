import {Args} from '@oclif/core'

import {WorkspaceFactory} from '../../factories/workspace.factory.js'
import {WorkspaceLauncherService} from '../../services/workspace-launcher.service.js'
import {BaseCommand} from '../base-command.js'

export default class WorkspaceVscode extends BaseCommand<typeof WorkspaceVscode> {
  /* eslint-disable perfectionist/sort-objects */
  // Positional order must be workspaceName, then contextName - do not sort alphabetically
  static args = {
    workspaceName: Args.string({
      description: 'Name of the workspace',
      required: true,
    }),
    contextName: Args.string({
      description: 'Name of the context to open in VSCode',
      required: true,
    }),
  }
  /* eslint-enable perfectionist/sort-objects */
  static description = 'Open a workspace context in VSCode'
  static examples = [
    '<%= config.bin %> <%= command.id %> my-project backend',
    '<%= config.bin %> <%= command.id %> my-project frontend',
  ]

  async run(): Promise<void> {
    await this.parse(WorkspaceVscode)

    const {contextName, workspaceName} = this.args

    // Get workspace service and fetch workspace by name
    const service = WorkspaceFactory.createWorkspaceService()
    const workspaceResult = await service.findWorkspaceByName(workspaceName)

    if (!workspaceResult.success) {
      this.error(
        `Workspace '${workspaceName}' not found. Run 'homelab workspace list' to see available workspaces.`,
        {exit: 1},
      )
    }

    const workspace = workspaceResult.data
    const contexts = workspace.contexts || []

    // Validate workspace has contexts configured
    if (contexts.length === 0) {
      this.error(
        `No contexts found for workspace '${workspaceName}'. Please configure contexts in PocketBase.`,
        {exit: 1},
      )
    }

    // Find matching context
    const matchingContext = contexts.find((c) => c.name === contextName)

    if (!matchingContext) {
      const contextNames = contexts.map((c) => c.name).join(', ')
      this.error(
        `Context '${contextName}' not found for workspace '${workspaceName}'. Available contexts: ${contextNames}`,
        {exit: 1},
      )
    }

    // Create launcher service and launch VSCode
    const launcherService = new WorkspaceLauncherService()
    const launchResult = await launcherService.launchVSCode(workspaceName, contextName)

    if (!launchResult.success) {
      this.error(`Failed to launch VSCode: ${launchResult.error.message}`, {exit: 1})
    }

    this.log(`Opened workspace '${workspaceName}' with context '${contextName}' in VSCode`)
  }
}
