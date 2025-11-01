# Implementation Tasks

## 1. Model Layer

- [ ] 1.1 Create `src/models/schemas/project.schema.ts` with Zod schema for project (id, name, description, gitRepoUrl, createdAt, updatedAt)
- [ ] 1.2 Create `src/models/project.dto.ts` with type inferred from ProjectSchema
- [ ] 1.3 Write tests in `test/models/schemas/project.schema.test.ts` to verify schema validation (valid data, invalid data, missing fields)

## 2. Repository Layer

- [ ] 2.1 Create `src/repositories/interfaces/project.repository.interface.ts` with IProjectRepository interface defining findByWorkspaceName method
- [ ] 2.2 Implement `src/repositories/project.repository.ts` that:
  - [ ] 2.2.1 Accepts PocketBaseConfig in constructor
  - [ ] 2.2.2 Implements findByWorkspaceName to fetch workspace with expanded projects relation
  - [ ] 2.2.3 Maps PocketBase records to ProjectDTO using ProjectSchema.parse()
  - [ ] 2.2.4 Returns Result<ProjectDTO[], RepositoryError>
  - [ ] 2.2.5 Handles authentication when credentials are provided
  - [ ] 2.2.6 Handles errors: workspace not found, connection errors, authentication errors, empty lists
- [ ] 2.3 Write tests in `test/repositories/project.repository.test.ts` for all scenarios (success, errors, edge cases)

## 3. Service Layer

- [ ] 3.1 Create `src/services/project.service.ts` that:
  - [ ] 3.1.1 Accepts IProjectRepository via constructor injection
  - [ ] 3.1.2 Implements listProjects(workspaceName: string) method
  - [ ] 3.1.3 Delegates to repository.findByWorkspaceName()
  - [ ] 3.1.4 Returns Result<ProjectDTO[], RepositoryError>
- [ ] 3.2 Write tests in `test/services/project.service.test.ts` using mock repository to verify success and error propagation

## 4. Factory Layer

- [ ] 4.1 Create `src/factories/project.factory.ts` with createProjectService() method that:
  - [ ] 4.1.1 Loads PocketBase configuration using loadPocketBaseConfig()
  - [ ] 4.1.2 Instantiates ProjectRepository with config
  - [ ] 4.1.3 Instantiates ProjectService with repository
  - [ ] 4.1.4 Handles configuration errors and throws descriptive messages

## 5. Command Layer

- [ ] 5.1 Create `src/commands/project/list.ts` that:
  - [ ] 5.1.1 Defines optional workspace name argument (Args.string)
  - [ ] 5.1.2 In run() method, determines workspace name from argument or current directory basename
  - [ ] 5.1.3 Gets service instance from ProjectFactory.createProjectService()
  - [ ] 5.1.4 Calls service.listProjects(workspaceName)
  - [ ] 5.1.5 Handles failure Results by calling this.error() with exit code 1
  - [ ] 5.1.6 Displays "No projects found for workspace '<name>'" if data array is empty
  - [ ] 5.1.7 Creates cli-table3 table with headers: NAME, DESCRIPTION, GIT REPO URL
  - [ ] 5.1.8 Populates table rows with project data
  - [ ] 5.1.9 Outputs table using this.log()
- [ ] 5.2 Write tests in `test/commands/project/list.test.ts` using runCommand() to verify:
  - [ ] 5.2.1 Listing with explicit workspace name
  - [ ] 5.2.2 Listing with current directory workspace
  - [ ] 5.2.3 Table output format
  - [ ] 5.2.4 Empty list handling
  - [ ] 5.2.5 Error handling

## 6. Build and Validation

- [ ] 6.1 Run `pnpm run build` to compile TypeScript
- [ ] 6.2 Run `pnpm test` to execute all tests and verify they pass
- [ ] 6.3 Run `pnpm run lint` to verify code style compliance
- [ ] 6.4 Test command manually: `./bin/dev.js project list` and `./bin/dev.js project list <workspace-name>`

## 7. Documentation

- [ ] 7.1 Run `pnpm run prepack` to regenerate README with new command documentation
- [ ] 7.2 Verify README includes `homelab project list` command with description and examples

## 8. PocketBase Setup (External Dependency)

- [ ] 8.1 Document PocketBase collection schema requirements in implementation notes:
  - Collection name: `projects`
  - Fields: name (text, required), description (text, required), gitRepoUrl (text, required)
  - Relation: workspace (single relation to workspaces collection, required)
  - Auto fields: id, created, updated
- [ ] 8.2 Note that PocketBase setup is a prerequisite for testing the feature end-to-end
