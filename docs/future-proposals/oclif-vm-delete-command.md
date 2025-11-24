/openspec:proposal Add a oclif command to delete Proxmox VMs
Add a new oclif command to the homelab-cli that allows users to delete Proxmox virtual machines (VMs) by specifying their VM IDs. The command should prompt for confirmation before proceeding with the deletion to prevent accidental data loss.
The command should handle errors gracefully, such as when a specified VM ID does not exist, and provide informative feedback to the user.
The command should support passing a flag for force deletion.
Use the existing Proxmox API integration in the homelab-cli as a reference for how to interact with Proxmox resources.
