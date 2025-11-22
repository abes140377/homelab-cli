import {Args} from '@oclif/core'
import {join} from 'node:path'

import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {BaseCommand} from '../lib/base-command.js'
import {CommandExecutorService} from '../services/command-executor.service.js'
import {detectCurrentProject} from '../utils/detect-current-project.js'

export default class Vscode extends BaseCommand<typeof Vscode> {
  static args = {
    'workspace-name': Args.string({
      description: 'Name of the workspace file (without .code-workspace extension)',
      required: false,
    }),
  }
  static description = 'Open current project or workspace in Visual Studio Code'
  static examples = [
    '# Open current project in VS Code (auto-detect from working directory)\n<%= config.bin %> <%= command.id %>',
    '# Open workspace for current project (auto-detect project)\n<%= config.bin %> <%= command.id %> myworkspace',
  ]

  async run(): Promise<void> {
    await this.parse(Vscode)

    // Load configuration
    let config
    try {
      config = loadProjectsDirConfig()
    } catch (error) {
      this.error(
        `Failed to load projects directory configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      )
    }

    // Always auto-detect current project from working directory
    const projectName = detectCurrentProject(process.cwd(), config.projectsDir)

    if (!projectName) {
      this.error(
        'Could not detect current project. Please run the command from within a project directory.',
        {exit: 1},
      )
    }

    const workspaceName = this.args['workspace-name']

    // Construct path based on arguments
    let cwd: string | undefined
    let targetPath: string

    if (workspaceName) {
      // Open workspace file
      targetPath = join(config.projectsDir, projectName, `${workspaceName}.code-workspace`)
    } else {
      // Open project directory with code .
      targetPath = '.'
      cwd = join(config.projectsDir, projectName)
    }

    this.log(`Opening ${workspaceName ? `workspace '${workspaceName}'` : 'project'} in VS Code...`)

    // Execute VS Code in detached mode so it runs independently
    const commandExecutor = new CommandExecutorService()
    const result = await commandExecutor.executeCommand('code', [targetPath, '--profile', `${workspaceName}`], {
      cwd,
      detached: true,
      stdio: 'ignore',
    })

    if (!result.success) {
      this.error(result.error.message, {exit: 1})
    }

    this.log(`VS Code opened successfully.`)
  }
}
