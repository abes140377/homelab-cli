# Proposal: add-enquirer-interactive-prompts

**Status**: Draft
**Created**: 2025-11-04
**Change Type**: Feature Addition

## Context

The homelab-cli currently relies solely on command-line arguments and flags for user input. This approach works well for automation and scripting but becomes cumbersome for interactive workflows where users need to provide multiple inputs or make choices from a set of options.

Currently, when commands require user input, they:
- Accept input exclusively via CLI flags and arguments (e.g., `--user`, `--password`, `--ipconfig`)
- Require users to remember all flag names and formats
- Don't provide validation feedback until after the command executes
- Don't offer guidance for valid options or choices

This creates friction for interactive use cases where:
- Users want to be prompted for inputs step-by-step
- Users need to select from predefined options (e.g., choosing a VM template, selecting a project)
- Users prefer guided workflows over memorizing command syntax
- Sensitive data (passwords, tokens) should be masked during input

## Problem Statement

The CLI lacks a standardized, reusable approach for collecting interactive user input through prompts. This limits the usability of commands that could benefit from guided, interactive workflows.

Without a prompt abstraction layer, each command would need to:
1. Directly integrate with a prompt library (creating tight coupling)
2. Duplicate prompt configuration logic across commands
3. Lack consistent styling, validation, and error handling
4. Make testing more difficult due to direct dependencies

## Proposed Solution

Integrate the `enquirer` npm package and create a standardized prompt abstraction layer that:

1. **Provides reusable prompt utilities** in `src/utils/prompts.ts`
   - Generic, configurable prompt functions (text, password, select, multi-select)
   - Support for default values/presets
   - Support for validation
   - Consistent error handling

2. **Creates a demonstration command** `homelab prompt demo`
   - Showcases all prompt types (text, password, select, multi-select)
   - Demonstrates default values and option passing
   - Serves as reference implementation for future commands

3. **Maintains architectural consistency**
   - Follows the project's layered architecture
   - Keeps prompts in the utilities layer
   - Enables easy testing through dependency injection
   - Separates prompt logic from command logic

## Goals

1. Enable interactive user input workflows in the CLI
2. Standardize prompt creation and configuration across all commands
3. Provide a reusable, testable abstraction over the enquirer library
4. Demonstrate prompt capabilities through a dedicated demo command
5. Maintain consistency with the project's architectural patterns

## Non-Goals

1. Replace all existing flag-based inputs (both approaches should coexist)
2. Create a full interactive menu system (focus on individual prompts)
3. Support all enquirer prompt types (start with core set: input, password, select, multiselect)
4. Add prompt capabilities to existing commands (start with demo, expand later)

## Scope

### In Scope
- Install enquirer as a production dependency
- Create prompt utility module (`src/utils/prompts.ts`) with generic prompt functions
- Implement support for: text input, password input, select, multi-select
- Support configuration: default values, options, validation, messages
- Create `homelab prompt demo` command demonstrating all prompt types
- Add comprehensive tests for prompt utilities and demo command
- Update project documentation

### Out of Scope
- Modifying existing commands to use prompts
- Advanced prompt types (autocomplete, form, survey, etc.)
- Persistent prompt history or saved preferences
- Custom prompt styling/theming
- i18n/localization for prompts

## Dependencies

- **External**: enquirer npm package (^2.4.1 or compatible)
- **Internal**: None (new capability, no dependencies on existing specs)

## Risks & Mitigations

**Risk**: Enquirer package maintenance/stability
**Mitigation**: enquirer is widely used (by eslint, webpack, yarn, etc.) and actively maintained. If needed, we can swap the implementation behind our abstraction layer.

**Risk**: Breaking changes in enquirer API
**Mitigation**: Our prompt utilities abstract the enquirer API, isolating changes to a single module.

**Risk**: Testing interactive prompts in CI/CD
**Mitigation**: Design utilities to accept input injection for testing (similar to oclif's testing patterns).

**Risk**: Increased bundle size
**Mitigation**: enquirer is lightweight (~4ms load time, minimal dependencies).

## Success Criteria

1. enquirer package is installed and integrated
2. Prompt utility module provides generic, configurable prompt functions
3. `homelab prompt demo` command successfully demonstrates all prompt types
4. All prompt utilities have comprehensive unit tests (>80% coverage)
5. Demo command has integration tests
6. Documentation is updated with prompt usage examples
7. All tests pass and code passes linting
8. Validation passes: `openspec validate add-enquirer-interactive-prompts --strict`

## Related Changes

None - this is a new foundational capability.

## Deltas

This proposal introduces the following spec deltas:

1. **interactive-prompts** (New Spec)
   - Defines requirements for the prompt utility abstraction layer
   - Specifies prompt types, configuration, validation, and error handling

2. **prompt-demo-command** (New Spec)
   - Defines requirements for the demonstration command
   - Specifies examples for each prompt type
