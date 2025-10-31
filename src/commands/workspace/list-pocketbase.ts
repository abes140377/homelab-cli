import Table from 'cli-table3'
import {format} from 'date-fns'
import {de} from 'date-fns/locale'

import {PocketBaseWorkspaceFactory} from '../../factories/pocketbase-workspace.factory.js'
import {BaseCommand} from '../base-command.js'

export default class WorkspaceListPocketbase extends BaseCommand<typeof WorkspaceListPocketbase> {
  static description = 'List all workspaces from PocketBase'
static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────────────────────────────────────┬──────────────┬─────────────────────┬─────────────────────┐
│ ID                                   │ NAME         │ CREATED AT          │ UPDATED AT          │
├──────────────────────────────────────┼──────────────┼─────────────────────┼─────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440001 │ production   │ 15.01.2024 10:00:00 │ 15.01.2024 10:00:00 │
├──────────────────────────────────────┼──────────────┼─────────────────────┼─────────────────────┤
│ 550e8400-e29b-41d4-a716-446655440002 │ staging      │ 20.01.2024 14:30:00 │ 01.02.2024 09:15:00 │
└──────────────────────────────────────┴──────────────┴─────────────────────┴─────────────────────┘
`,
  ]

  async run(): Promise<void> {
    await this.parse(WorkspaceListPocketbase)

    // Create service with PocketBase repository
    let service
    try {
      service = PocketBaseWorkspaceFactory.createWorkspaceService()
    } catch (error) {
      this.error(
        `Failed to initialize PocketBase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {exit: 1},
      )
    }

    // Fetch workspaces from PocketBase
    const result = await service.listWorkspaces()

    if (!result.success) {
      this.error(`Failed to list workspaces: ${result.error.message}`, {
        exit: 1,
      })
    }

    const workspaces = result.data

    if (workspaces.length === 0) {
      this.log('No workspaces found.')
      return
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['ID', 'NAME', 'CREATED AT', 'UPDATED AT'],
    })

    // Add workspace rows
    for (const workspace of workspaces) {
      const id = workspace.id.padEnd(36)
      const name = workspace.name.padEnd(12)
      const createdAt = format(workspace.createdAt, 'dd.MM.yyyy HH:mm:ss', {locale: de})
      const updatedAt = format(workspace.updatedAt, 'dd.MM.yyyy HH:mm:ss', {locale: de})

      table.push([id, name, createdAt, updatedAt])
    }

    // Output table
    this.log(table.toString())
  }
}
