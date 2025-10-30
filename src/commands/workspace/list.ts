import {WorkspaceFactory} from '../../factories/workspace.factory.js';
import { BaseCommand } from '../base-command.js';

export default class WorkspaceList extends BaseCommand<typeof WorkspaceList> {
  static description = 'List all workspaces';
static examples = [
    `<%= config.bin %> <%= command.id %>
ID                                   NAME         CREATED AT           UPDATED AT
550e8400-e29b-41d4-a716-446655440001 production   2024-01-15 10:00:00  2024-01-15 10:00:00
550e8400-e29b-41d4-a716-446655440002 staging      2024-01-20 14:30:00  2024-02-01 09:15:00
550e8400-e29b-41d4-a716-446655440003 development  2024-02-01 08:00:00  2024-02-10 16:45:00
`,
  ];

  async run(): Promise<void> {
    await this.parse(WorkspaceList);

    const service = WorkspaceFactory.createWorkspaceService();
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

    // Format as table
    this.log('ID                                   NAME         CREATED AT           UPDATED AT');
    this.log('─'.repeat(90));

    for (const workspace of workspaces) {
      const id = workspace.id.padEnd(36);
      const name = workspace.name.padEnd(12);
      const createdAt = workspace.createdAt.toISOString().replace('T', ' ').split('.')[0];
      const updatedAt = workspace.updatedAt.toISOString().replace('T', ' ').split('.')[0];

      this.log(`${id} ${name} ${createdAt}  ${updatedAt}`);
    }
  }
}
