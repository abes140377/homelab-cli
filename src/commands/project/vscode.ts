import { Args } from '@oclif/core'
import { spawn } from 'node:child_process'
import { join } from 'node:path'

import { loadProjectsDirConfig } from '../../config/projects-dir.config.js'
import { BaseCommand } from '../../lib/base-command.js'
import { detectCurrentProject } from '../../utils/detect-current-project.js'

export default class ProjectVscode extends BaseCommand<typeof ProjectVscode> {
  static args = {
    'project-name': Args.string({
      description: 'Name of the project (defaults to current project)',
      required: false,
    }),
    'workspace-name': Args.string({
      description: 'Name of the workspace file (without .code-workspace extension)',
      required: false,
    }),
  }
  static description = 'Open a project or workspace in Visual Studio Code'
  static examples = [
    '# Open current project in VS Code (auto-detect project from working directory)\n<%= config.bin %> <%= command.id %>',
    '# Open workspace for current project (auto-detect project)\n<%= config.bin %> <%= command.id %> myworkspace',
    '# Open specific project in VS Code\n<%= config.bin %> <%= command.id %> sflab',
    '# Open specific workspace in specific project\n<%= config.bin %> <%= command.id %> sflab homelab',
  ]

  async run(): Promise<void> {
    await this.parse(ProjectVscode)

    // Load configuration
    let config
    try {
      config = loadProjectsDirConfig()
    } catch (error) {
      this.error(
        `Failed to load projects directory configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { exit: 1 },
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
          { exit: 1 },
        )
      }

      projectName = detectedProject
    }

    const workspaceName = this.args['workspace-name']

    // Construct path based on arguments
    let targetPath: string
    let cwd: string | undefined

    if (workspaceName) {
      // Open workspace file
      targetPath = join(config.projectsDir, projectName, `${workspaceName}.code-workspace`)
    } else {
      // Open project directory with code .
      targetPath = '.'
      cwd = join(config.projectsDir, projectName)
    }

    this.log(`Opening ${workspaceName ? `workspace '${workspaceName}'` : 'project'} in VS Code... with targetPath: ${targetPath}`)

    // Execute VS Code
    // We need to wait briefly for spawn to either succeed or fail before detaching
    await new Promise<void>((resolve, reject) => {
      const child = spawn('code', [targetPath], {
        cwd,
        detached: true,
        stdio: 'ignore',
      })

      // Handle spawn errors (like command not found)
      child.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') {
          reject(
            new Error(
              "VSCode CLI 'code' command not found. Please ensure VSCode is installed and 'code' is in your PATH.",
            ),
          )
        } else {
          reject(new Error(`Failed to open VSCode: ${error.message}`))
        }
      })

      // Once spawned successfully, detach and resolve
      child.on('spawn', () => {
        child.unref()
        resolve()
      })
    })
      .then(() => {
        this.log(
          `Opening ${workspaceName ? `workspace '${workspaceName}'` : 'project'} in VS Code...`,
        )
      })
      .catch((error) => {
        this.error(error.message, { exit: 1 })
      })
  }
}
