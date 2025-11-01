import Table from 'cli-table3';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import {WorkspaceFactory} from '../../factories/workspace.factory.js';
import { BaseCommand } from '../base-command.js';

export default class WorkspaceList extends BaseCommand<typeof WorkspaceList> {
  static description = 'List all workspaces from PocketBase';
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
    await this.parse(WorkspaceList);

    // Create service with PocketBase repository
    let service;
    try {
      service = WorkspaceFactory.createWorkspaceService();
    } catch (error) {
      this.error(
        `Failed to initialize PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      );
    }

    // Fetch workspaces from PocketBase
    const result = await service.listWorkspaces();

    if (!result.success) {
      this.error(`Failed to list workspaces: ${result.error.message}`, {
        exit: 1,
      });
    }

    const workspaces = result.data;

    if (workspaces.length === 0) {
      this.log('No workspaces found.');
      return;
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['ID', 'NAME', 'CREATED AT', 'UPDATED AT'],
    })

    // Add template rows
    for (const workspace of workspaces) {
        const id = workspace.id.padEnd(36);
        const name = workspace.name.padEnd(12);
        const createdAt = format(workspace.createdAt, 'dd.MM.yyyy HH:mm:ss', { locale: de });
        const updatedAt = format(workspace.updatedAt, 'dd.MM.yyyy HH:mm:ss', { locale: de });

        table.push([id, name, createdAt, updatedAt]);
    }

    // Output table
    this.log(table.toString())
  }
}
