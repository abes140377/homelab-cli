# Design: add-enquirer-interactive-prompts

## Overview

This design introduces a prompt abstraction layer for interactive user input, built on the enquirer npm package. The design prioritizes:
- Clean separation of concerns (command logic vs prompt logic)
- Reusability across commands
- Testability through dependency injection
- Type safety with TypeScript and Zod validation
- Consistency with the project's architectural patterns

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────┐
│ Command Layer (src/commands/prompt/demo.ts)        │
│ - Defines what prompts to show                      │
│ - Handles prompt results                            │
│ - Formats output                                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ uses
                  ▼
┌─────────────────────────────────────────────────────┐
│ Prompt Utilities (src/utils/prompts.ts)            │
│ - promptForText()                                    │
│ - promptForPassword()                                │
│ - promptForSelection()                               │
│ - promptForMultipleSelections()                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ wraps
                  ▼
┌─────────────────────────────────────────────────────┐
│ Enquirer Library (node_modules/enquirer)           │
│ - Input, Password, Select, MultiSelect prompts     │
└─────────────────────────────────────────────────────┘
```

### Data Flow

1. **Command invocation**: User runs `homelab prompt demo`
2. **Prompt configuration**: Command defines prompt configuration (message, options, defaults)
3. **Prompt execution**: Utility functions call enquirer with configuration
4. **User interaction**: User provides input through terminal prompts
5. **Result processing**: Utility returns result wrapped in Result<T> type
6. **Output formatting**: Command formats and displays results

## Design Decisions

### 1. Location: Utilities Layer

**Decision**: Place prompt functions in `src/utils/prompts.ts`

**Rationale**:
- Prompts are cross-cutting utilities used by multiple commands
- Not domain-specific business logic (not service layer)
- Not data access (not repository layer)
- Aligns with existing utils like `result.ts`

**Alternatives Considered**:
- **Service Layer**: Too heavyweight; prompts don't contain business logic
- **Lib Layer**: Reserved for base classes and framework extensions
- **Separate `/prompts` directory**: Overkill for initial implementation

### 2. Abstraction Level: Thin Wrapper Functions

**Decision**: Create simple wrapper functions for each prompt type, not a class hierarchy

**Rationale**:
- Functional programming style matches Result pattern usage
- Simpler to test and use
- No state to manage
- Easy to compose
- Follows YAGNI (You Aren't Gonna Need It)

**Alternatives Considered**:
- **Class-based abstraction** (e.g., `PromptBuilder`, `PromptManager`):
  - Would add unnecessary complexity
  - Prompts are stateless operations
  - Class instance management overhead

- **Direct enquirer usage in commands**:
  - Creates tight coupling to library
  - Duplicates configuration logic
  - Harder to test
  - Difficult to swap libraries later

### 3. API Design: Configuration Objects

**Decision**: Use configuration objects with sensible defaults

```typescript
interface PromptOptions<T> {
  message: string;
  initial?: T;
  validate?: (value: T) => boolean | string;
  skip?: boolean;
}

interface SelectionOptions<T> extends PromptOptions<T> {
  choices: T[];
}
```

**Rationale**:
- Explicit and self-documenting
- Type-safe with TypeScript
- Extensible (easy to add more options)
- Familiar pattern (similar to oclif's Args/Flags)

### 4. Return Type: Result Pattern

**Decision**: Return `Result<T>` for consistency with project patterns

```typescript
export async function promptForText(
  options: PromptOptions<string>
): Promise<Result<string>>
```

**Rationale**:
- Consistent with service and repository layers
- Forces explicit error handling
- Type-safe error handling
- Enables composition with other Result-returning functions

**Note**: User cancellation (Ctrl+C) will throw and be caught, returning error Result

### 5. Testing Strategy: Dependency Injection

**Decision**: Make enquirer injectable for testing

```typescript
// Production
import * as enquirer from 'enquirer';
export const promptForText = createPromptForText(enquirer);

// Testing
const mockEnquirer = { prompt: async () => ({ answer: 'test' }) };
const testPrompt = createPromptForText(mockEnquirer);
```

**Rationale**:
- Enables unit testing without user interaction
- Follows oclif's testing patterns (e.g., `runCommand` mocks)
- Maintains functional style
- No framework needed (no dependency injection container)

### 6. Demo Command: Command-Only Architecture

**Decision**: Implement demo command without service/repository layers

**Rationale**:
- Demo command is a simple demonstration, not business logic
- No external APIs or data sources
- Follows project pattern: "Use command-only for simple operations"
- Reduces boilerplate for this use case

**Alternatives Considered**:
- **Layered architecture with service**: Unnecessary overhead for a demo

### 7. Validation: Optional, User-Defined

**Decision**: Support validation through optional `validate` function in options

```typescript
await promptForText({
  message: 'Enter email:',
  validate: (value) => value.includes('@') || 'Invalid email'
});
```

**Rationale**:
- Validation requirements vary by use case
- Enquirer supports this pattern natively
- Keeps prompt utilities generic
- Enables reuse across different validation scenarios

**Note**: For complex validation, commands can use Zod schemas post-prompt

## Implementation Details

### File Structure

```
src/
├── utils/
│   ├── prompts.ts           # Prompt utility functions
│   └── prompts.types.ts     # TypeScript interfaces
├── commands/
│   └── prompt/
│       └── demo.ts          # Demo command
test/
├── utils/
│   └── prompts.test.ts      # Prompt utilities tests
└── commands/
    └── prompt/
        └── demo.test.ts     # Demo command integration tests
```

### Key Modules

#### `src/utils/prompts.ts`

Core prompt utilities:

```typescript
export async function promptForText(
  options: PromptOptions<string>
): Promise<Result<string>>

export async function promptForPassword(
  options: PromptOptions<string>
): Promise<Result<string>>

export async function promptForSelection<T>(
  options: SelectionOptions<T>
): Promise<Result<T>>

export async function promptForMultipleSelections<T>(
  options: SelectionOptions<T[]>
): Promise<Result<T[]>>
```

#### `src/commands/prompt/demo.ts`

Demonstration command showing all prompt types:

```typescript
export default class PromptDemo extends BaseCommand<typeof PromptDemo> {
  static description = 'Demonstrate interactive prompts'

  async run(): Promise<void> {
    // Text input
    const nameResult = await promptForText({
      message: 'What is your name?',
      initial: 'Guest'
    });

    // Password input
    const passwordResult = await promptForPassword({
      message: 'Enter your password:'
    });

    // Select input
    const optionResult = await promptForSelection({
      message: 'Choose an option:',
      choices: ['option 1', 'option 2', 'option 3']
    });

    // Multi-select input
    const multiResult = await promptForMultipleSelections({
      message: 'Select multiple options:',
      choices: ['option A', 'option B', 'option C']
    });

    // Display results
    this.log(/* formatted output */);
  }
}
```

### Error Handling

1. **User Cancellation (Ctrl+C)**: Caught and returned as error Result
2. **Validation Failures**: Enquirer shows inline error, re-prompts user
3. **Library Errors**: Caught and wrapped in error Result with context

### Type Safety

1. **Generic Types**: Functions use generics to preserve choice types
2. **Zod Validation**: Can be applied to prompt results if needed
3. **TypeScript Interfaces**: All configuration objects are strongly typed

## Testing Approach

### Unit Tests (src/utils/prompts.test.ts)

- Test each prompt function in isolation
- Mock enquirer library
- Test success cases, error cases, cancellation
- Test default value handling
- Test validation functions

### Integration Tests (test/commands/prompt/demo.test.ts)

- Use oclif's `runCommand` utility
- Mock prompt utilities (not enquirer directly)
- Test command output formatting
- Test error display

## Migration Path

### Phase 1: Foundation (This Proposal)
- Install enquirer
- Create prompt utilities
- Create demo command
- Write tests and documentation

### Phase 2: Adoption (Future)
- Identify commands that would benefit from prompts
- Add optional interactive mode (e.g., `--interactive` flag)
- Commands can use both flags and prompts

### Phase 3: Enhancement (Future)
- Add more prompt types (autocomplete, etc.)
- Add prompt composition utilities
- Add prompt templates for common patterns

## Open Questions

1. **Should prompts support JSON output mode?**
   - **Decision**: No, prompts are inherently interactive. Commands using prompts should fail with an error if `--json` flag is present.

2. **Should we support prompt chaining/composition?**
   - **Decision**: Not in initial implementation. Individual functions are sufficient. Can add later if needed.

3. **How to handle prompts in CI/CD environments?**
   - **Decision**: Commands must support both prompt mode and flag mode. Use flags in non-interactive environments.

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Enquirer breaking changes | High | Low | Abstraction layer isolates changes; can swap libraries |
| Testing difficulty | Medium | Low | Dependency injection enables full test coverage |
| Bundle size increase | Low | Low | Enquirer is lightweight; monitor with bundle analyzer |
| TTY detection issues | Medium | Medium | Detect TTY availability; fall back to flag mode |

## Success Metrics

- [ ] Zero direct enquirer imports in command files (only via utils)
- [ ] 100% test coverage for prompt utilities
- [ ] Demo command demonstrates all four prompt types
- [ ] All tests pass in CI/CD
- [ ] Documentation includes usage examples
- [ ] Validation passes: `openspec validate --strict`
