/openspec:proposal Create a oclif command 'homelab proxmox template list' to list Proxmox VM templates via REST API
Output:
- Table with VMID, Name, Template
- Sorting: Nach VMID aufsteigend
- Empty Rest Data: "No templates found"
Data retrieval should be done in the Repository Layer via the Proxmox REST API.
Proxmox API Integration:
- Endpoint: GET {host}/api2/json/cluster/resources?type=vm
- Auth: API Token via Authorization: PVEAPIToken={tokenID}={secret}
- SSL: Accept Self-signed Zertificate
- Template-Filter: Response-Objektes filtered by template: 1
Environment-Variables:
- PROXMOX_HOST (https://proxmox.home.sflab.io:8006)
- PROXMOX_API_TOKEN (Format: root@pam!homelabcli=bd2ed89e-6a09-48e8-8a6e-38da9128c8ce)
