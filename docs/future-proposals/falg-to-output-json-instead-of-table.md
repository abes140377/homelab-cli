/openspec:proposal Add a json flag to output json instead of table
Add a --json flag to my oclif command base class that allows output to be presented in JSON format instead of the default table view.
When the flag is set, command outputs should be produced in JSON to provide a machine‑readable format that can be used in scripts and automations.
Use the command at `src/commands/proxmox/vm/list.ts` as an example implementation.
Modify only that command to test the functionality. Other commands can be adjusted later once the implementation has been successfully tested.
