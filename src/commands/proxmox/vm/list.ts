import Table from 'cli-table3'

import {ProxmoxVMFactory} from '../../../factories/proxmox-vm.factory.js'
import { BaseCommand } from '../../../lib/base-command.js'

export default class ProxmoxVMList extends BaseCommand<typeof ProxmoxVMList> {
  static description = 'List all Proxmox VMs (non-templates)'
  static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────┬─────────────────┬──────────┬───────────────┐
│ VMID │ Name            │ Status   │ IPv4 Address  │
├──────┼─────────────────┼──────────┼───────────────┤
│ 100  │ web-server      │ running  │ 192.168.1.10  │
│ 101  │ database        │ running  │ 192.168.1.11  │
│ 102  │ backup          │ stopped  │ N/A           │
└──────┴─────────────────┴──────────┴───────────────┘
`,
  ]

  async run(): Promise<void> {
    await this.parse(ProxmoxVMList)

    const service = ProxmoxVMFactory.createProxmoxVMService()
    const result = await service.listVMs()

    if (!result.success) {
      this.error(`Failed to list VMs: ${result.error.message}`, {
        exit: 1,
      })
    }

    const vms = result.data

    if (vms.length === 0) {
      this.log('No VMs found')
      return
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['VMID', 'Name', 'Status', 'IPv4 Address'],
    })

    // Add VM rows
    for (const vm of vms) {
      table.push([
        vm.vmid.toString(),
        vm.name,
        vm.status,
        vm.ipv4Address ?? 'N/A',
      ])
    }

    // Output table
    this.log(table.toString())
  }
}
