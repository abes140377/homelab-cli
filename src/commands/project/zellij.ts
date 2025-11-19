import {Args} from '@oclif/core'
import {basename, join} from 'node:path'

import {loadProjectsDirConfig} from '../../config/projects-dir.config.js'
import {BaseCommand} from '../../lib/base-command.js'
import {CommandExecutorService} from '../../services/command-executor.service.js'
import {detectCurrentProject} from '../../utils/detect-current-project.js'

export default class ProjectZellij extends BaseCommand<typeof ProjectZellij> {
  static args = {
    'config-name': Args.string({
      description: 'Name of the Zellij config file (without .kdl extension, defaults to current directory basename)',
      required: false,
    }),
    'project-name': Args.string({
      description: 'Name of the project (defaults to current project)',
      required: false,
    }),
  }
  static description = 'Open a Zellij session for a project with a specific configuration'
  static examples = [
    '# Open Zellij session with auto-detected project and config (from current directory basename)\n<%= config.bin %> <%= command.id %>',
    '# Open Zellij session with auto-detected project and explicit config\n<%= config.bin %> <%= command.id %> myconfig',
    '# Open Zellij session with explicit project and auto-detected config\n<%= config.bin %> <%= command.id %> sflab',
    '# Open Zellij session with explicit project and config\n<%= config.bin %> <%= command.id %> sflab homelab-cli',
  ]

  async run(): Promise<void> {
    await this.parse(ProjectZellij)

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

    // Determine project name
    let projectName = this.args['project-name']

    if (!projectName) {
      // Auto-detect current project from working directory
      const detectedProject = detectCurrentProject(process.cwd(), config.projectsDir)

      if (!detectedProject) {
        this.error(
          'Could not detect current project. Please provide a project name or run the command from within a project directory.',
          {exit: 1},
        )
      }

      projectName = detectedProject
    }

    // Determine config name
    let configName = this.args['config-name']

    if (!configName) {
      // Auto-detect config name from current working directory basename
      configName = basename(process.cwd())
    }

    // Construct Zellij config path
    const configPath = join(config.projectsDir, projectName, '.config/zellij', `${configName}.kdl`)

    // Check if session already exists
    const sessionAlreadyExists = await this.sessionExists(configName)

    if (sessionAlreadyExists) {
      this.log(`Attaching to existing Zellij session '${configName}'...`)
    } else {
      this.log(`Opening new Zellij session '${configName}' for project '${projectName}'...`)
    }

    // Execute Zellij - either attach to existing session or create new one
    // We need to wait for the process to complete (unlike VSCode which detaches)
    // Choose the appropriate command based on whether session exists
    const zellijArgs = sessionAlreadyExists ? ['attach', configName] : ['-n', configPath, '-s', configName]

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
