---
description: 'Prompt and workflow for generating conventional commit messages using a clear Markdown format. Guides users to create standardized, descriptive commit messages in line with the Conventional Commits specification, including instructions, examples, and validation.'
# tools: ['run_in_terminal', 'get_terminal_output']
---

## Instructions

This file contains a prompt template for generating conventional commit messages. It provides instructions, examples, and formatting guidelines to help users write standardized, descriptive commit messages in accordance with the Conventional Commits specification.

## Workflow

**Follow these steps:**

1. Search for integrated linters or formatters and execute them if necessary.
2. Run `git status` to review changed files.
3. Run `git diff` or `git diff --cached` to inspect changes.
4. Stage your changes with `git add <file>`.
5. Construct your commit message using the following format.
6. Review the generated commit message for accuracy and completeness.
7. After generating your commit message, Copilot will automatically run the following command in your integrated terminal (no confirmation needed):

```bash
git commit -m "type(scope): description"
```

8. Just execute this prompt and Copilot will handle the commit for you in the terminal.

## Commit Message Structure

- **type**: One of `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **scope**: Optional, but recommended for clarity (e.g., `parser`, `ui`)
- **description**: A short, imperative summary of the change
- **body**: (Optional) More detailed explanation
- **footer**: (Optional) Breaking changes or issue references

**Format:**

```
type(scope): description

body

footer
```

## Examples

- `feat(parser): add ability to parse arrays`
- `fix(ui): correct button alignment`
- `docs: update README with usage instructions`
- `refactor: improve performance of data processing`
- `chore: update dependencies`
- `feat!: send email on registration

  BREAKING CHANGE: email service required`

## Validation

- **type**: Must be one of the allowed types. See [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/#specification)
- **scope**: Optional, but recommended for clarity.
- **description**: Required. Use the imperative mood (e.g., "add", not "added").
- **body**: Optional. Use for additional context.
- **footer**: Use for breaking changes or issue references.

## Final Step

Replace with your constructed message. Include body and footer if needed.

```bash
git commit -m "type(scope): description"
```
