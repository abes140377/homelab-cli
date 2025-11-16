import {Args} from '@oclif/core'
import Table from 'cli-table3'

import {loadProjectsDirConfig} from '../../config/projects-dir.config.js'
import {ModuleFactory} from '../../factories/module.factory.js'
import {BaseCommand} from '../../lib/base-command.js'
import {detectCurrentProject} from '../../utils/detect-current-project.js'

export default class ProjectModuleList extends BaseCommand<typeof ProjectModuleList> {
  static args = {
    'project-name': Args.string({
      description: 'Name of the project to list modules for (defaults to current project)',
      required: false,
    }),
  }
  static description = 'List all modules for a project from filesystem'
  static examples = [
    `<%= config.bin %> <%= command.id %> sflab
┌──────────────┬──────────────────────────────────────┐
│ NAME         │ GIT REPOSITORY URL                   │
├──────────────┼──────────────────────────────────────┤
│ module1      │ git@github.com:user/module1.git      │
├──────────────┼──────────────────────────────────────┤
│ module2      │ git@github.com:user/module2.git      │
└──────────────┴──────────────────────────────────────┘
`,
    `# List modules for current project (auto-detect from working directory)
<%= config.bin %> <%= command.id %>`,
  ]

  async run(): Promise<void> {
    await this.parse(ProjectModuleList)

    // Determine project name
    let projectName = this.args['project-name']

    if (!projectName) {
      // Auto-detect current project from working directory
      try {
        const config = loadProjectsDirConfig()
        const detectedProject = detectCurrentProject(process.cwd(), config.projectsDir)

        if (!detectedProject) {
          this.error(
            'Could not detect current project. Please provide a project name or run the command from within a project directory.',
            {exit: 1},
          )
        }

        projectName = detectedProject
      } catch (error) {
        this.error(
          `Failed to detect current project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          {exit: 1},
        )
      }
    }

    // Create service with filesystem repository
    let service
    try {
      service = ModuleFactory.createModuleFsService()
    } catch (error) {
      this.error(
        `Failed to initialize filesystem repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      )
    }

    // Fetch modules from filesystem
    const result = await service.listModules(projectName)

    if (!result.success) {
      this.error(`Failed to list modules: ${result.error.message}`, {
        exit: 1,
      })
    }

    const modules = result.data

    if (modules.length === 0) {
      this.log(`No modules found for project '${projectName}'.`)
      return
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['NAME', 'GIT REPOSITORY URL'],
    })

    // Add module rows
    for (const module of modules) {
      const name = module.name.padEnd(12)
      const gitRepoUrl = module.gitRepoUrl || '(no remote)'

      table.push([name, gitRepoUrl])
    }

    // Output table
    this.log(table.toString())
  }
}
