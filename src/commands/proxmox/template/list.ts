import Table from 'cli-table3'

import type {ProxmoxTemplateDTO} from '../../../models/proxmox-template.dto.js'

import {ProxmoxTemplateFactory} from '../../../factories/proxmox-template.factory.js'
import { BaseCommand } from '../../../lib/base-command.js'

export default class ProxmoxTemplateList extends BaseCommand<typeof ProxmoxTemplateList> {
  static description = 'List all Proxmox VM templates'
  static examples = [
    `<%= config.bin %> <%= command.id %>
┌──────┬─────────────────┬──────────┐
│ VMID │ Name            │ Template │
├──────┼─────────────────┼──────────┤
│ 100  │ ubuntu-22.04    │ Yes      │
│ 101  │ debian-12       │ Yes      │
└──────┴─────────────────┴──────────┘
`,
    `<%= config.bin %> <%= command.id %> --json
[
  {
    "vmid": 100,
    "name": "ubuntu-22.04",
    "node": "pve1",
    "template": 1
  },
  {
    "vmid": 101,
    "name": "debian-12",
    "node": "pve1",
    "template": 1
  }
]
`,
  ]

  async run(): Promise<ProxmoxTemplateDTO[] | void> {
    await this.parse(ProxmoxTemplateList)

    const service = ProxmoxTemplateFactory.createProxmoxTemplateService()
    const result = await service.listTemplates()

    if (!result.success) {
      this.error(`Failed to list templates: ${result.error.message}`, {
        exit: 1,
      })
    }

    const templates = result.data

    // Handle JSON output mode
    if (this.jsonEnabled()) {
      return templates
    }

    // Handle table output mode
    if (templates.length === 0) {
      this.log('No templates found')
      return
    }

    // Create table using cli-table3
    const table = new Table({
      head: ['VMID', 'Name', 'Template'],
    })

    // Add template rows
    for (const template of templates) {
      table.push([template.vmid.toString(), template.name, 'Yes'])
    }

    // Output table
    this.log(table.toString())
  }
}
