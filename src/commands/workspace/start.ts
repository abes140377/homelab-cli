import { Args, Flags } from '@oclif/core';

import { WorkspaceFactory } from '../../factories/workspace.factory.js';
import { WorkspaceLauncherService } from '../../services/workspace-launcher.service.js';
import { BaseCommand } from '../base-command.js';

export default class WorkspaceStart extends BaseCommand<typeof WorkspaceStart> {
  static args = {
    workspaceName: Args.string({
      description: 'Name of the workspace to start',
      required: true,
    }),
  }
  static description = 'Start a workspace in VSCode or terminal'
  static examples = [
    `<%= config.bin %> <%= command.id %> my-project --vscode`,
    `<%= config.bin %> <%= command.id %> my-project --vscode --context backend`,
    `<%= config.bin %> <%= command.id %> my-project --terminal`,
  ]
  static flags = {
    context: Flags.string({
      char: 'c',
      dependsOn: ['vscode'],
      description: 'Context name (required when workspace has multiple contexts)',
    }),
    terminal: Flags.boolean({
      char: 't',
      description: 'Open workspace in terminal',
      exclusive: ['vscode'],
    }),
    vscode: Flags.boolean({
      char: 'v',
      description: 'Open workspace in VSCode',
      exclusive: ['terminal'],
    }),
  }

  async run(): Promise<void> {
    await this.parse(WorkspaceStart);

    const { workspaceName } = this.args;
    const { context, terminal, vscode } = this.flags;

    // Validate that exactly one of --vscode or --terminal is provided
    if (!vscode && !terminal) {
      this.error('Please specify either --vscode or --terminal flag', { exit: 1 });
    }

    // Get workspace service and fetch workspace by name
    const service = WorkspaceFactory.createWorkspaceService();
    const workspaceResult = await service.findWorkspaceByName(workspaceName);

    this.log(`Fetched workspace result: ${JSON.stringify(workspaceResult)}`);

    if (!workspaceResult.success) {
      this.error(
        `Workspace '${workspaceName}' not found. Run 'homelab workspace list' to see available workspaces.`,
        { exit: 1 },
      );
    }

    const workspace = workspaceResult.data;
    const contexts = workspace.contexts || [];

    // Create launcher service
    const launcherService = new WorkspaceLauncherService();

    if (vscode) {
      // VSCode mode: handle context selection
      if (contexts.length === 0) {
        this.error(
          `No contexts found for workspace '${workspaceName}'. Please configure contexts in PocketBase.`,
          { exit: 1 },
        );
      }

      let selectedContext: string;

      if (contexts.length === 1) {
        // Auto-select single context
        selectedContext = contexts[0].name;
      } else {
        // Multiple contexts - require --context flag
        if (!context) {
          const contextNames = contexts.map((c) => c.name).join(', ');
          this.error(
            `Multiple contexts available: ${contextNames}. Please specify --context <name>`,
            { exit: 1 },
          );
        }

        // Find matching context
        const matchingContext = contexts.find((c) => c.name === context);

        if (!matchingContext) {
          const contextNames = contexts.map((c) => c.name).join(', ');
          this.error(
            `Context '${context}' not found. Available contexts: ${contextNames}`,
            { exit: 1 },
          );
        }

        selectedContext = matchingContext.name;
      }

      // Launch VSCode
      const launchResult = await launcherService.launchVSCode(workspaceName, selectedContext);

      if (!launchResult.success) {
        this.error(`Failed to launch VSCode: ${launchResult.error.message}`, { exit: 1 });
      }

      this.log(`Opened workspace '${workspaceName}' with context '${selectedContext}' in VSCode`);
    } else if (terminal) {
      // Terminal mode
      const launchResult = await launcherService.openTerminal(workspaceName);

      if (!launchResult.success) {
        this.error(`Failed to open terminal: ${launchResult.error.message}`, { exit: 1 });
      }

      this.log(`Opened workspace '${workspaceName}' in terminal`);
    }
  }
}
