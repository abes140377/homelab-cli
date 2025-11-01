import Table from 'cli-table3';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {ProjectFactory} from '../../factories/project.factory.js';
import { BaseCommand } from '../base-command.js';

export default class ProjectList extends BaseCommand<typeof ProjectList> {
  static description = 'List all projects from PocketBase';
static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────────────────────────────────────┬──────────────┬─────────────────────┬─────────────────────┐
│ ID                                   │ NAME         │ CREATED AT          │ UPDATED AT          │
├──────────────────────────────────────┼──────────────┼─────────────────────┼─────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440001 │ production   │ 2024-01-15 10:00:00 │ 2024-01-15 10:00:00 │
├──────────────────────────────────────┼──────────────┼─────────────────────┼─────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440002 │ staging      │ 2024-01-20 14:30:00 │ 2024-02-01 09:15:00 │
├──────────────────────────────────────┼──────────────┼─────────────────────┼─────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440003 │ development  │ 2024-02-01 08:00:00 │ 2024-02-10 16:45:00 │
└──────────────────────────────────────┴──────────────┴─────────────────────┴─────────────────────┘
`,
  ];

  async run(): Promise<void> {
    await this.parse(ProjectList);

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
      head: ['ID', 'NAME', 'CREATED AT', 'UPDATED AT'],
    })

    // Add template rows
    for (const project of projects) {
        const id = project.id.padEnd(36);
        const name = project.name.padEnd(12);
        const createdAt = format(project.createdAt, 'dd.MM.yyyy HH:mm:ss', { locale: de });
        const updatedAt = format(project.updatedAt, 'dd.MM.yyyy HH:mm:ss', { locale: de });

        table.push([id, name, createdAt, updatedAt]);
    }

    // Output table
    this.log(table.toString())
  }
}
