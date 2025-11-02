import Table from 'cli-table3'

import {ProxmoxVMFactory} from '../../../factories/proxmox-vm.factory.js'
import { BaseCommand } from '../../../lib/base-command.js'

export default class ProxmoxContainerList extends BaseCommand<typeof ProxmoxContainerList> {
  static description = 'List all Proxmox LXC containers'
  static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────┬─────────────────┬──────────┬───────────────┐
│ VMID │ Name            │ Status   │ IPv4 Address  │
├──────┼─────────────────┼──────────┼───────────────┤
│ 100  │ web-container   │ running  │ 192.168.1.10  │
│ 101  │ db-container    │ running  │ 192.168.1.11  │
│ 102  │ test-container  │ stopped  │ N/A           │
└──────┴─────────────────┴──────────┴───────────────┘
`,
  ]

  async run(): Promise<void> {
    await this.parse(ProxmoxContainerList)

    const service = ProxmoxVMFactory.createProxmoxVMService()
    const result = await service.listVMs('lxc')

    if (!result.success) {
      this.error(`Failed to list containers: ${result.error.message}`, {
        exit: 1,
      })
    }

    const containers = result.data

    if (containers.length === 0) {
      this.log('No containers found')
      return
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['VMID', 'Name', 'Status', 'IPv4 Address'],
    })

    // Add container rows
    for (const container of containers) {
      table.push([
        container.vmid.toString(),
        container.name,
        container.status,
        container.ipv4Address ?? 'N/A',
      ])
    }

    // Output table
    this.log(table.toString())
  }
}
