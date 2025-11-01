import {Args} from '@oclif/core';
import Table from 'cli-table3';
import {basename} from 'node:path';

import {ModuleFactory} from '../../factories/module.factory.js';
import {BaseCommand} from '../base-command.js';

export default class ModuleList extends BaseCommand<typeof ModuleList> {
  static args = {
    workspaceName: Args.string({
      description: 'Name of the workspace to list modules for (defaults to current directory basename)',
      required: false,
    }),
  };
static description = 'List all modules for a workspace';
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
    await this.parse(ModuleList);

    // Determine workspace name from argument or current directory
    const workspaceName = this.args.workspaceName || basename(process.cwd());

    // Create service with PocketBase repository
    let service;
    try {
      service = ModuleFactory.createModuleService();
    } catch (error) {
      this.error(
        `Failed to initialize PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      );
    }

    // Fetch modules from PocketBase
    const result = await service.listModules(workspaceName);

    if (!result.success) {
      this.error(`Failed to list modules: ${result.error.message}`, {
        exit: 1,
      });
    }

    const modules = result.data;

    if (modules.length === 0) {
      this.log(`No modules found for workspace '${workspaceName}'.`);
      return;
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['NAME', 'DESCRIPTION', 'GIT REPO URL'],
    });

    // Add module rows
    for (const module of modules) {
      table.push([module.name, module.description, module.gitRepoUrl]);
    }

    // Output table
    this.log(table.toString());
  }
}
