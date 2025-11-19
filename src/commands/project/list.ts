import Table from 'cli-table3';

import { ProjectFactory } from '../../factories/project.factory.js';
import { BaseCommand } from '../../lib/base-command.js';

export default class ProjectList extends BaseCommand<typeof ProjectList> {
  static description = 'List all projects from filesystem';
  static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────────────┬──────────────────────────────────────┐
│ NAME         │ GIT REPOSITORY URL                   │
├──────────────┼──────────────────────────────────────┤
│ project1     │ git@github.com:user/project1.git     │
├──────────────┼──────────────────────────────────────┤
│ project2     │ git@github.com:user/project2.git     │
├──────────────┼──────────────────────────────────────┤
│ project3     │ git@github.com:user/project3.git     │
└──────────────┴──────────────────────────────────────┘
`,
  ];

  async run(): Promise<void> {
    await this.parse(ProjectList);

    let service;
    try {
      service = ProjectFactory.createProjectService();
    } catch (error) {
      this.error(
        `Failed to initialize filesystem repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { exit: 1 },
      );
    }

    // Fetch projects from filesystem
    const result = await service.listProjects();

    if (!result.success) {
      this.error(`Failed to list projects: ${result.error.message}`, {
        exit: 1,
      });
    }

    const projects = result.data;

    if (projects.length === 0) {
      this.log('No projects found.');
      return;
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['NAME', 'GIT REPOSITORY URL'],
    })

    // Add project rows
    for (const project of projects) {
      const name = project.name.padEnd(12);
      const gitRepoUrl = project.gitRepoUrl || '(no remote)';

      table.push([name, gitRepoUrl]);
    }

    // Output table
    this.log(table.toString())
  }
}
