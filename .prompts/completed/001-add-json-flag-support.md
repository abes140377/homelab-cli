<objective>
Add --json flag support to 5 oclif commands following the established pattern from src/commands/proxmox/vm/list.ts.

This enhancement enables programmatic consumption of command outputs by returning structured JSON data instead of formatted tables, making the CLI more automation-friendly.
</objective>

<context>
The project is a TypeScript CLI built with oclif. The --json flag is a global flag provided by BaseCommand, accessible via this.jsonEnabled().

Reference implementation: @src/commands/proxmox/vm/list.ts (lines 44-87)

The pattern already works correctly - we just need to apply it consistently to other list/create commands.
</context>

<requirements>
Apply the --json flag support pattern to these 5 commands:

1. src/commands/proxmox/vm/create.ts
2. src/commands/proxmox/template/list.ts
3. src/commands/proxmox/container/list.ts
4. src/commands/project/list.ts
5. src/commands/module/list.ts

For each command, make these specific changes:

1. **Update return type**: Change `async run(): Promise<void>` to `async run(): Promise<DataType[] | void>` or `Promise<DataType | void>` (use the appropriate DTO type that the command already retrieves)

2. **Add JSON example**: Add a second example to the `static examples` array showing --json output with realistic sample data

3. **Add JSON mode check**: After successfully retrieving data and before the "no data" check or table rendering, add:
   ```typescript
   if (this.jsonEnabled()) {
     return dataVariable
   }
   ```

4. **Keep table rendering**: The existing table rendering code should remain unchanged below the JSON check
</requirements>

<implementation>
Follow this pattern exactly (based on proxmox/vm/list.ts):

**Return Type Pattern:**
- For list commands returning arrays: `Promise<SomeDTO[] | void>`
- For create commands returning single objects: `Promise<SomeDTO | void>`

**JSON Example Pattern:**
```typescript
static examples = [
  `<%= config.bin %> <%= command.id %>
[existing table example]
`,
  `<%= config.bin %> <%= command.id %> --json
[
  {
    "field1": "value1",
    "field2": "value2"
  }
]
`,
]
```

**JSON Check Pattern (insert after data retrieval, before table rendering):**
```typescript
const data = result.data

// Handle JSON output mode
if (this.jsonEnabled()) {
  return data
}

// Handle table output mode
if (data.length === 0) {
  this.log('No items found')
  return
}
// ... rest of table rendering
```

**Specific notes per command:**

- **proxmox/vm/create.ts**: Returns single object, not array. Return type should be `Promise<ProxmoxVMDTO | void>`. Return `result.data` (which contains {name, node, vmid})

- **proxmox/template/list.ts**: Returns `ProxmoxTemplateDTO[]`. Use the templates variable.

- **proxmox/container/list.ts**: Returns `ProxmoxVMDTO[]`. Use the containers variable.

- **project/list.ts**: Returns `ProjectDTO[]`. Use the projects variable.

- **module/list.ts**: Returns `ModuleDTO[]`. Use the modules variable.
</implementation>

<output>
Modify these files in place using the Edit tool:
- ./src/commands/proxmox/vm/create.ts
- ./src/commands/proxmox/template/list.ts
- ./src/commands/proxmox/container/list.ts
- ./src/commands/project/list.ts
- ./src/commands/module/list.ts

Do NOT create new files. Edit the existing files following the exact pattern.
</output>

<verification>
After making changes, verify:

1. All 5 files have updated return types
2. All 5 files have JSON examples in their examples array
3. All 5 files check `this.jsonEnabled()` and return data when true
4. Table rendering code remains unchanged and functional
5. Run `pnpm run build` to ensure TypeScript compiles without errors
6. Run `pnpm run lint` to ensure code style is consistent

Example manual test (after build):
```bash
./bin/dev.js proxmox template list --json
./bin/dev.js project list --json
./bin/dev.js module list myproject --json
```
</verification>

<success_criteria>
- All 5 commands compile without TypeScript errors
- All 5 commands support --json flag consistently
- JSON output uses the same field names as the DTOs (camelCase)
- Table output remains unchanged from current behavior
- No linting errors introduced
</success_criteria>
