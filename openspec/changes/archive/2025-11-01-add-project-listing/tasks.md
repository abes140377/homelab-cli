# Implementation Tasks

## 1. Model Layer

- [x] 1.1 Create `src/models/schemas/project.schema.ts` with Zod schema for project (id, name, description, gitRepoUrl, createdAt, updatedAt)
- [x] 1.2 Create `src/models/project.dto.ts` with type inferred from ProjectSchema
- [x] 1.3 Write tests in `test/models/schemas/project.schema.test.ts` to verify schema validation (valid data, invalid data, missing fields)

## 2. Repository Layer

- [x] 2.1 Create `src/repositories/interfaces/project.repository.interface.ts` with IProjectRepository interface defining findByWorkspaceName method
- [x] 2.2 Implement `src/repositories/project.repository.ts` that:
  - [x] 2.2.1 Accepts PocketBaseConfig in constructor
  - [x] 2.2.2 Implements findByWorkspaceName to fetch workspace with expanded projects relation
  - [x] 2.2.3 Maps PocketBase records to ProjectDTO using ProjectSchema.parse()
  - [x] 2.2.4 Returns Result<ProjectDTO[], RepositoryError>
  - [x] 2.2.5 Handles authentication when credentials are provided
  - [x] 2.2.6 Handles errors: workspace not found, connection errors, authentication errors, empty lists
- [x] 2.3 Write tests in `test/repositories/project.repository.test.ts` for all scenarios (success, errors, edge cases)

## 3. Service Layer

- [x] 3.1 Create `src/services/project.service.ts` that:
  - [x] 3.1.1 Accepts IProjectRepository via constructor injection
  - [x] 3.1.2 Implements listProjects(workspaceName: string) method
  - [x] 3.1.3 Delegates to repository.findByWorkspaceName()
  - [x] 3.1.4 Returns Result<ProjectDTO[], RepositoryError>
- [x] 3.2 Write tests in `test/services/project.service.test.ts` using mock repository to verify success and error propagation

## 4. Factory Layer

- [x] 4.1 Create `src/factories/project.factory.ts` with createProjectService() method that:
  - [x] 4.1.1 Loads PocketBase configuration using loadPocketBaseConfig()
  - [x] 4.1.2 Instantiates ProjectRepository with config
  - [x] 4.1.3 Instantiates ProjectService with repository
  - [x] 4.1.4 Handles configuration errors and throws descriptive messages

## 5. Command Layer

- [x] 5.1 Create `src/commands/project/list.ts` that:
  - [x] 5.1.1 Defines optional workspace name argument (Args.string)
  - [x] 5.1.2 In run() method, determines workspace name from argument or current directory basename
  - [x] 5.1.3 Gets service instance from ProjectFactory.createProjectService()
  - [x] 5.1.4 Calls service.listProjects(workspaceName)
  - [x] 5.1.5 Handles failure Results by calling this.error() with exit code 1
  - [x] 5.1.6 Displays "No projects found for workspace '<name>'" if data array is empty
  - [x] 5.1.7 Creates cli-table3 table with headers: NAME, DESCRIPTION, GIT REPO URL
  - [x] 5.1.8 Populates table rows with project data
  - [x] 5.1.9 Outputs table using this.log()
- [x] 5.2 Write tests in `test/commands/project/list.test.ts` using runCommand() to verify:
  - [x] 5.2.1 Listing with explicit workspace name
  - [x] 5.2.2 Listing with current directory workspace
  - [x] 5.2.3 Table output format
  - [x] 5.2.4 Empty list handling
  - [x] 5.2.5 Error handling

## 6. Build and Validation

- [x] 6.1 Run `pnpm run build` to compile TypeScript
- [x] 6.2 Run `pnpm test` to execute all tests and verify they pass
- [x] 6.3 Run `pnpm run lint` to verify code style compliance
- [x] 6.4 Test command manually: `./bin/dev.js project list` and `./bin/dev.js project list <workspace-name>`

## 7. Documentation

- [x] 7.1 Run `pnpm run prepack` to regenerate README with new command documentation
- [x] 7.2 Verify README includes `homelab project list` command with description and examples

## 8. PocketBase Setup (External Dependency)

- [x] 8.1 Document PocketBase collection schema requirements in implementation notes:
  - Collection name: `projects`
  - Fields: name (text, required), description (text, required), gitRepoUrl (text, required)
  - Relation: workspace (single relation to workspaces collection, required)
  - Auto fields: id, created, updated
- [x] 8.2 Note that PocketBase setup is a prerequisite for testing the feature end-to-end
