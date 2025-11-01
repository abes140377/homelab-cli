import {Args} from '@oclif/core';
import Table from 'cli-table3';
import {basename} from 'node:path';

import {ProjectFactory} from '../../factories/project.factory.js';
import {BaseCommand} from '../base-command.js';

export default class ProjectList extends BaseCommand<typeof ProjectList> {
  static args = {
    workspaceName: Args.string({
      description: 'Name of the workspace to list projects for (defaults to current directory basename)',
      required: false,
    }),
  };
static description = 'List all projects for a workspace';
static examples = [
    `<%= config.bin %> <%= command.id %>
┌─────────────┬─────────────────────────────┬──────────────────────────────────┐
│ NAME        │ DESCRIPTION                 │ GIT REPO URL                     │
├─────────────┼─────────────────────────────┼──────────────────────────────────┤
│ app         │ Main application repository │ https://github.com/user/app      │
├─────────────┼─────────────────────────────┼──────────────────────────────────┤
│ api         │ API service repository      │ https://github.com/user/api      │
└─────────────┴─────────────────────────────┴──────────────────────────────────┘
`,
    '<%= config.bin %> <%= command.id %> my-workspace',
  ];

  async run(): Promise<void> {
    await this.parse(ProjectList);

    // Determine workspace name from argument or current directory
    const workspaceName = this.args.workspaceName || basename(process.cwd());

    // Create service with PocketBase repository
    let service;
    try {
      service = ProjectFactory.createProjectService();
    } catch (error) {
      this.error(
        `Failed to initialize PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      );
    }

    // Fetch projects from PocketBase
    const result = await service.listProjects(workspaceName);

    if (!result.success) {
      this.error(`Failed to list projects: ${result.error.message}`, {
        exit: 1,
      });
    }

    const projects = result.data;

    if (projects.length === 0) {
      this.log(`No projects found for workspace '${workspaceName}'.`);
      return;
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['NAME', 'DESCRIPTION', 'GIT REPO URL'],
    });

    // Add project rows
    for (const project of projects) {
      table.push([project.name, project.description, project.gitRepoUrl]);
    }

    // Output table
    this.log(table.toString());
  }
}
