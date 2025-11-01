# Workspace Start Command - Technical Design

## Context

The homelab-cli provides workspace listing functionality that fetches workspaces from PocketBase. Users currently need to manually navigate to workspace directories and open their development environments. This change introduces a `workspace start` command that automates launching workspaces in either VSCode (with proper context files) or terminal.

The PocketBase backend has been configured with:
- `workspaces` collection: Contains workspace records with id, name, created, updated fields
- `contexts` collection: Contains context records with id, name, workspace (relation to workspaces)
- Each workspace can have one or more contexts
- Each context corresponds to a `.code-workspace` file in the workspace directory

## Goals / Non-Goals

**Goals:**

- Implement `homelab workspace start <workspace-name>` command
- Support mutually exclusive flags: `--vscode` and `--terminal`
- Add `--context` flag for selecting context when using `--vscode`
- Fetch workspace with contexts from PocketBase in a single query (using expand)
- Launch VSCode with workspace file: `code ~/projects/<workspace-name>/<context-name>.code-workspace`
- Open terminal at workspace directory: `cd ~/projects/<workspace-name>`
- Extend domain models to include workspace-context relationship
- Provide clear, actionable error messages
- Maintain existing layered architecture patterns

**Non-Goals:**

- Create or modify workspace directories (assume they exist)
- Create or modify `.code-workspace` files (assume they exist)
- Support custom workspace directory paths (use fixed `~/projects/` pattern)
- Support multiple simultaneous launches (one environment per command)
- Support IDEs other than VSCode (future enhancement)
- Support Windows command execution (macOS/Linux only initially)

## Decisions

### Decision 1: Mutually Exclusive Flags with oclif

**What:** Implement `--vscode` and `--terminal` as mutually exclusive flags where exactly one must be provided.

**Why:**

- User must explicitly choose the launch target
- Prevents ambiguous behavior (what if both flags provided?)
- oclif supports `exclusive` and `exactlyOne` flag relationships
- Clear intent from command invocation

**Implementation:**

```typescript
static flags = {
  vscode: Flags.boolean({
    char: 'v',
    description: 'Open workspace in VSCode',
    exclusive: ['terminal'],
  }),
  terminal: Flags.boolean({
    char: 't',
    description: 'Open workspace in terminal',
    exclusive: ['vscode'],
  }),
  context: Flags.string({
    char: 'c',
    description: 'Context name (required when workspace has multiple contexts)',
    dependsOn: ['vscode'],
  }),
}
```

**Validation in command:**
- Check that exactly one of `--vscode` or `--terminal` is provided
- If neither provided: Show helpful error: "Please specify --vscode or --terminal"
- If both provided: oclif will automatically prevent this with `exclusive` property

### Decision 2: Context Selection Strategy

**What:** When `--vscode` is used, require `--context` flag if workspace has multiple contexts, auto-select if only one context exists.

**Why:**

- Single context: No ambiguity, auto-select provides best UX
- Multiple contexts: Explicit selection prevents wrong context launch
- User feedback indicated preference for explicit selection over interactive prompts
- Consistent with CLI tool expectations (explicit over implicit)

**Implementation:**

```typescript
// In command run() method
const contexts = workspace.contexts || []

if (flags.vscode) {
  if (contexts.length === 0) {
    this.error('No contexts found for workspace')
  }

  if (contexts.length === 1) {
    // Auto-select single context
    contextToLaunch = contexts[0]
  } else {
    // Multiple contexts - require --context flag
    if (!flags.context) {
      const contextNames = contexts.map(c => c.name).join(', ')
      this.error(`Multiple contexts available: ${contextNames}. Please specify --context <name>`)
    }

    contextToLaunch = contexts.find(c => c.name === flags.context)
    if (!contextToLaunch) {
      this.error(`Context '${flags.context}' not found`)
    }
  }
}
```

### Decision 3: Domain Model Extension

**What:** Extend workspace domain model to include optional contexts array.

**Why:**

- Contexts are closely related to workspaces (composition relationship)
- PocketBase supports expand syntax to fetch relations in single query
- Keeps model consistent with PocketBase schema
- Avoids separate query for contexts (performance)

**Schema changes:**

```typescript
// src/models/schemas/workspace-context.schema.ts
export const WorkspaceContextSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// src/models/schemas/workspace.schema.ts (modified)
export const WorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  contexts: z.array(WorkspaceContextSchema).optional(), // NEW FIELD
})
```

### Decision 4: Repository Method Addition

**What:** Add `findByName(name: string)` method to `IWorkspaceRepository` interface.

**Why:**

- Start command needs single workspace by name, not all workspaces
- More efficient than fetching all and filtering
- PocketBase supports filtering: `getFirstListItem(\`name="${name}"\`)`
- Standard repository pattern (findAll, findById, findByName)

**Implementation:**

```typescript
// Interface
interface IWorkspaceRepository {
  findAll(): Promise<Result<WorkspaceDTO[], RepositoryError>>
  findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>> // NEW
}

// PocketBase implementation
async findByName(name: string): Promise<Result<WorkspaceDTO, RepositoryError>> {
  try {
    const record = await this.client
      .collection('workspaces')
      .getFirstListItem(`name="${name}"`, {
        expand: 'contexts', // Fetch related contexts in same query
      })

    // Map record + expanded contexts to WorkspaceDTO
    return success(mappedWorkspace)
  } catch (error) {
    if (error.status === 404) {
      return failure(new RepositoryError(`Workspace '${name}' not found`))
    }
    return failure(new RepositoryError('Failed to fetch workspace'))
  }
}
```

### Decision 5: Workspace Launcher Service

**What:** Create `WorkspaceLauncherService` to handle launching logic, separate from workspace data retrieval.

**Why:**

- Separation of concerns: WorkspaceService handles data, LauncherService handles launching
- LauncherService can be mocked/tested independently
- Different responsibilities: data vs. system commands
- Single responsibility principle

**Service structure:**

```typescript
export class WorkspaceLauncherService {
  /**
   * Launches VSCode with specified workspace and context
   */
  async launchVSCode(
    workspaceName: string,
    contextName: string,
  ): Promise<Result<void, ServiceError>> {
    const workspacePath = path.join(os.homedir(), 'projects', workspaceName, `${contextName}.code-workspace`)

    // Verify file exists before launching
    if (!fs.existsSync(workspacePath)) {
      return failure(new ServiceError(`Workspace file not found: ${workspacePath}`))
    }

    try {
      // Execute: code <workspace-file>
      execSync(`code "${workspacePath}"`, { stdio: 'inherit' })
      return success(undefined)
    } catch (error) {
      return failure(new ServiceError('Failed to launch VSCode', { cause: error }))
    }
  }

  /**
   * Opens terminal at workspace directory
   */
  async openTerminal(workspaceName: string): Promise<Result<void, ServiceError>> {
    const workspaceDir = path.join(os.homedir(), 'projects', workspaceName)

    // Verify directory exists
    if (!fs.existsSync(workspaceDir)) {
      return failure(new ServiceError(`Workspace directory not found: ${workspaceDir}`))
    }

    // Note: `cd` is shell built-in, can't be executed directly
    // Instead, we'll print the command for user to execute
    // OR spawn interactive shell at directory

    try {
      // Spawn interactive shell at directory
      const shell = process.env.SHELL || '/bin/bash'
      spawnSync(shell, [], {
        cwd: workspaceDir,
        stdio: 'inherit',
      })
      return success(undefined)
    } catch (error) {
      return failure(new ServiceError('Failed to open terminal', { cause: error }))
    }
  }
}
```

### Decision 6: Terminal Opening Strategy

**What:** Spawn interactive shell at workspace directory instead of printing `cd` command.

**Why:**

- Printing `cd` command doesn't actually change directory (shell context limitation)
- Spawning shell provides immediate interactive environment
- User can exit shell to return to original directory
- Consistent with user expectation of "open in terminal"

**Alternative considered:**

- Print `cd` command for user to copy/paste: Rejected - poor UX, requires manual step
- Use osascript (macOS Terminal.app): Rejected - platform-specific, complex
- tmux/screen session: Rejected - assumes specific tools installed

**Implementation:**

```typescript
const shell = process.env.SHELL || '/bin/bash'
spawnSync(shell, [], {
  cwd: workspaceDir,
  stdio: 'inherit', // Connects child process to current terminal
})
```

### Decision 7: Path Construction

**What:** Construct paths using fixed pattern `~/projects/<workspace-name>/`.

**Why:**

- User clarified workspace name equals directory name
- No separate 'path' or 'home' field in PocketBase
- Fixed prefix simplifies implementation
- Consistent with homelab project structure

**Path patterns:**

```typescript
// Workspace directory
const workspaceDir = path.join(os.homedir(), 'projects', workspaceName)
// Example: /Users/username/projects/homelab-cli/

// VSCode workspace file
const workspaceFile = path.join(
  os.homedir(),
  'projects',
  workspaceName,
  `${contextName}.code-workspace`
)
// Example: /Users/username/projects/homelab-cli/backend.code-workspace
```

### Decision 8: Error Handling and Validation

**What:** Validate existence of paths before executing commands, provide clear error messages.

**Why:**

- Prevent confusing system errors (file not found, permission denied)
- Guide user to fix issues (missing directory, wrong context name)
- Graceful degradation instead of crashes

**Validation points:**

1. Workspace exists in PocketBase
2. Workspace has contexts (for --vscode)
3. Workspace directory exists on filesystem
4. VSCode workspace file exists (for --vscode)
5. `code` command is available in PATH (for --vscode)

**Error messages:**

```typescript
// Workspace not in PocketBase
"Workspace 'foo' not found. Run 'homelab workspace list' to see available workspaces."

// No contexts for workspace
"No contexts found for workspace 'foo'. Please configure contexts in PocketBase."

// Multiple contexts, no --context flag
"Multiple contexts available: backend, frontend, mobile. Please specify --context <name>"

// Context not found
"Context 'backend' not found. Available contexts: frontend, mobile"

// Workspace directory missing
"Workspace directory not found: ~/projects/foo/. Please ensure workspace exists."

// VSCode workspace file missing
"Workspace file not found: ~/projects/foo/backend.code-workspace"

// VSCode command not available
"VSCode 'code' command not found. Please install VSCode CLI: https://code.visualstudio.com/docs/setup/mac#_launching-from-the-command-line"
```

### Decision 9: Command Execution Strategy

**What:** Use Node.js `child_process` module (`execSync`, `spawnSync`) for executing commands.

**Why:**

- Built-in Node.js module (no external dependencies)
- Synchronous execution ensures command completes before CLI exits
- `stdio: 'inherit'` connects child process to parent terminal (for interactive shell)
- Error handling through try-catch

**Security considerations:**

- Workspace name comes from PocketBase (trusted source)
- Context name comes from PocketBase (trusted source)
- Paths are constructed programmatically (not user input concatenation)
- Use double quotes around paths to handle spaces safely

**Implementation:**

```typescript
import {execSync, spawnSync} from 'child_process'

// For VSCode (non-interactive)
execSync(`code "${workspacePath}"`, { stdio: 'inherit' })

// For terminal (interactive)
spawnSync(shell, [], { cwd: workspaceDir, stdio: 'inherit' })
```

## Data Flow

```
User: homelab workspace start my-project --vscode --context backend
    ↓
WorkspaceStartCommand.run()
    ├─ Parse args: workspaceName = 'my-project'
    ├─ Parse flags: vscode = true, context = 'backend'
    ├─ Validate: exactly one of --vscode or --terminal provided
    ├─ WorkspaceFactory.createWorkspaceService()
    │   └─ service with PocketBaseWorkspaceRepository
    ├─ service.findWorkspaceByName('my-project')
    │   └─ repository.findByName('my-project')
    │       ├─ PocketBase: getFirstListItem(\`name="my-project"\`, {expand: 'contexts'})
    │       ├─ Map record to WorkspaceDTO with contexts array
    │       └─ Return Result<WorkspaceDTO, RepositoryError>
    ├─ Handle workspace not found error
    ├─ If --vscode:
    │   ├─ Select context (auto if 1, require flag if >1)
    │   ├─ WorkspaceLauncherService.launchVSCode('my-project', 'backend')
    │   │   ├─ Construct path: ~/projects/my-project/backend.code-workspace
    │   │   ├─ Verify file exists
    │   │   ├─ execSync: code "<path>"
    │   │   └─ Return Result<void, ServiceError>
    │   └─ Handle launch errors
    └─ If --terminal:
        ├─ WorkspaceLauncherService.openTerminal('my-project')
        │   ├─ Construct dir: ~/projects/my-project/
        │   ├─ Verify directory exists
        │   ├─ spawnSync: $SHELL with cwd=dir
        │   └─ Return Result<void, ServiceError>
        └─ Handle launch errors
```

## Directory Structure

```
src/
├── models/
│   ├── workspace-context.dto.ts                 # NEW: Context DTO
│   ├── schemas/
│   │   ├── workspace-context.schema.ts          # NEW: Context Zod schema
│   │   └── workspace.schema.ts                  # MODIFIED: Add contexts field
│   └── workspace.dto.ts                         # MODIFIED: Update type
├── repositories/
│   ├── interfaces/
│   │   └── workspace.repository.interface.ts    # MODIFIED: Add findByName
│   └── pocketbase-workspace.repository.ts       # MODIFIED: Implement findByName with expand
├── services/
│   ├── workspace.service.ts                     # MODIFIED: Add findWorkspaceByName
│   └── workspace-launcher.service.ts            # NEW: Launch VSCode/terminal
├── commands/
│   └── workspace/
│       └── start.ts                             # NEW: Start command

test/
├── services/
│   └── workspace-launcher.service.test.ts       # NEW: Launcher tests
├── commands/
│   └── workspace/
│       └── start.test.ts                        # NEW: Command tests
└── repositories/
    └── pocketbase-workspace.repository.test.ts  # MODIFIED: Add findByName tests
```

## PocketBase Integration

### Query with Expand

```typescript
// Fetch workspace with contexts in single query
const record = await this.client
  .collection('workspaces')
  .getFirstListItem(\`name="${name}"\`, {
    expand: 'contexts', // PocketBase expands relation automatically
  })

// Record structure:
{
  id: '...',
  name: 'my-project',
  created: '2024-10-31T...',
  updated: '2024-10-31T...',
  expand: {
    contexts: [
      { id: '...', name: 'backend', created: '...', updated: '...' },
      { id: '...', name: 'frontend', created: '...', updated: '...' },
    ]
  }
}
```

### Mapping Strategy

```typescript
const workspaceData = {
  id: record.id,
  name: record.name,
  createdAt: new Date(record.created),
  updatedAt: new Date(record.updated),
  contexts: record.expand?.contexts?.map(ctx => ({
    id: ctx.id,
    name: ctx.name,
    createdAt: new Date(ctx.created),
    updatedAt: new Date(ctx.updated),
  })) || [],
}

// Validate with extended WorkspaceSchema
return WorkspaceSchema.parse(workspaceData)
```

## Testing Strategy

### Unit Tests - WorkspaceLauncherService

- Mock `fs.existsSync` to test file/directory existence checks
- Mock `execSync` and `spawnSync` to avoid actual command execution
- Test success paths (file exists, command succeeds)
- Test failure paths (file missing, command fails, permission denied)
- Test path construction correctness

### Unit Tests - WorkspaceService.findWorkspaceByName

- Mock repository returning WorkspaceDTO with contexts
- Test success path with single context
- Test success path with multiple contexts
- Test failure path (workspace not found)

### Unit Tests - PocketBaseWorkspaceRepository.findByName

- Mock PocketBase client
- Test getFirstListItem with name filter and expand
- Test mapping of record with expanded contexts
- Test 404 error handling (workspace not found)
- Test network errors

### Command Tests - WorkspaceStart

- Mock factory to return service with mock repository
- Mock WorkspaceLauncherService
- Test --vscode flag with single context (auto-select)
- Test --vscode flag with multiple contexts and --context specified
- Test --vscode flag with multiple contexts and NO --context (error)
- Test --terminal flag
- Test neither flag provided (error)
- Test both flags provided (oclif should prevent, but verify)
- Test workspace not found error
- Test context not found error
- Test launcher service errors

## Risks / Trade-offs

### Risk: Platform-Specific Command Execution

**Risk:** Command execution may behave differently on Windows vs. macOS/Linux.

**Mitigation:**

- Initial implementation targets macOS/Linux (homelab environment)
- Document platform requirements
- Future enhancement: Add Windows support with platform detection

### Risk: VSCode CLI Not Installed

**Risk:** User may not have `code` command in PATH.

**Mitigation:**

- Check command existence before execution
- Provide clear error message with installation instructions
- Link to official VSCode CLI setup docs

### Risk: Workspace Directory Structure Mismatch

**Risk:** Actual workspace directories may not match expected structure.

**Mitigation:**

- Validate file/directory existence before command execution
- Provide clear error messages indicating what's missing
- Document expected directory structure conventions

### Trade-off: Auto-select vs. Interactive Prompt

**Trade-off:** Auto-selecting single context is convenient but less explicit.

**Rationale:**

- Single context has no ambiguity
- Saves user typing when obvious choice exists
- Consistent with CLI tool expectations
- User feedback preferred explicit selection over prompts

### Trade-off: Spawning Shell vs. Printing Command

**Trade-off:** Spawning interactive shell changes user's current terminal session.

**Rationale:**

- More aligned with "open in terminal" expectation
- User can exit shell to return
- Printing command requires manual copy/paste (poor UX)
- Alternative: Open new terminal window (platform-specific, complex)

## Open Questions

### Q1: Should we validate `code` command availability before execution?

**Answer:** Yes. Check using `which code` or similar before execSync. Provide installation instructions if missing.

### Q2: Should context selection be case-sensitive?

**Answer:** Yes, maintain case sensitivity to match PocketBase data exactly. No normalization.

### Q3: Should we cache workspace lookups?

**Answer:** No caching in initial implementation. Each command invocation fetches fresh data from PocketBase. Future enhancement if performance becomes issue.

### Q4: Should terminal flag support custom shells?

**Answer:** Use `SHELL` environment variable with fallback to `/bin/bash`. No custom shell flag initially - keep interface simple.
