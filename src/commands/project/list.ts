import Table from 'cli-table3';

import type { ProjectDto } from '../../models/project.dto.js';

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
    `<%= config.bin %> <%= command.id %> --json
[
  {
    "name": "project1",
    "gitRepoUrl": "git@github.com:user/project1.git"
  },
  {
    "name": "project2",
    "gitRepoUrl": "git@github.com:user/project2.git"
  },
  {
    "name": "project3",
    "gitRepoUrl": "git@github.com:user/project3.git"
  }
]
`,
  ];

  async run(): Promise<ProjectDto[] | void> {
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

    // Handle JSON output mode
    if (this.jsonEnabled()) {
      return projects;
    }

    // Handle table output mode
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
