import {Args} from '@oclif/core'
import {join} from 'node:path'

import {loadProjectsDirConfig} from '../config/projects-dir.config.js'
import {BaseCommand} from '../lib/base-command.js'
import {CommandExecutorService} from '../services/command-executor.service.js'
import {detectCurrentProject} from '../utils/detect-current-project.js'

export default class Zellij extends BaseCommand<typeof Zellij> {
  static args = {
    'module-name': Args.string({
      description: 'Name of the module',
      required: true,
    }),
    // eslint-disable-next-line perfectionist/sort-objects -- Order matters for positional arguments in oclif
    'config-name': Args.string({
      description: 'Name of the Zellij config file (without .kdl extension, defaults to "default")',
      required: false,
    }),
  }
  static description = 'Open a Zellij session for a project module with a specific configuration'
  static examples = [
    '# Open Zellij session with default config\n<%= config.bin %> <%= command.id %> my-module',
    '# Open Zellij session with custom config\n<%= config.bin %> <%= command.id %> my-module custom-config',
  ]

  async run(): Promise<void> {
    await this.parse(Zellij)

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

    // Detect current project from working directory
    const projectName = detectCurrentProject(process.cwd(), config.projectsDir)

    if (!projectName) {
      this.error(
        'Could not detect current project. Please run the command from within a project directory.',
        {exit: 1},
      )
    }

    // Get module name (required argument)
    const moduleName = this.args['module-name']

    // Determine config name (defaults to 'default')
    const configName = this.args['config-name'] || 'default'

    // Construct Zellij config path
    const configPath = join(config.projectsDir, projectName, '.config/zellij', moduleName, `${configName}.kdl`)

    // Construct session name
    const sessionName = `${moduleName}-${configName}`

    // Check if session already exists
    const sessionAlreadyExists = await this.sessionExists(sessionName)

    if (sessionAlreadyExists) {
      this.log(`Attaching to existing Zellij session '${sessionName}'...`)
    } else {
      this.log(`Opening new Zellij session '${sessionName}' for project '${projectName}', module '${moduleName}'...`)
    }

    // Execute Zellij - either attach to existing session or create new one
    // We need to wait for the process to complete (unlike VSCode which detaches)
    // Choose the appropriate command based on whether session exists
    const zellijArgs = sessionAlreadyExists ? ['attach', sessionName] : ['-n', configPath, '-s', sessionName]

    const commandExecutor = new CommandExecutorService()
    const result = await commandExecutor.executeCommand('zellij', zellijArgs, {
      stdio: 'inherit', // Pass stdin/stdout/stderr to Zellij for interactive session
    })

    if (!result.success) {
      this.error(result.error.message, {exit: 1})
    }

    this.log('Zellij session closed.')
  }

  /**
   * Check if a Zellij session with the given name exists
   */
  private async sessionExists(sessionName: string): Promise<boolean> {
    const commandExecutor = new CommandExecutorService()
    const result = await commandExecutor.executeCommand('zellij', ['list-sessions'])

    if (!result.success || !result.data.stdout) {
      // If list-sessions fails, assume no sessions exist
      return false
    }

    // Check if the session name appears in the output
    // The output format is like: "session-name [Created...] (STATUS...)"
    return result.data.stdout.includes(sessionName)
  }
}
