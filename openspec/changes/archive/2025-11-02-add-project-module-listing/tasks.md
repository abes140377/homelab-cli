# Implementation Tasks

## 1. Model Layer
- [x] 1.1 Create `src/models/schemas/module-fs.schema.ts` with ModuleFsSchema (name, gitRepoUrl)
- [x] 1.2 Create `src/models/module-fs.dto.ts` with type inference from schema
- [x] 1.3 Write tests for ModuleFsSchema in `test/models/schemas/module-fs.schema.test.ts`

## 2. Repository Layer
- [x] 2.1 Create `src/repositories/interfaces/module-fs.repository.interface.ts` with IModuleFsRepository
- [x] 2.2 Implement `src/repositories/module-fs.repository.ts` with ModuleFsRepository class
  - [x] 2.2.1 Implement findByProjectName(projectName: string) method
  - [x] 2.2.2 Implement private isGitRepository(dirPath: string) helper
  - [x] 2.2.3 Implement private getGitRemoteUrl(dirPath: string) helper
  - [x] 2.2.4 Implement private createModuleDto(dirPath: string, name: string) helper
- [x] 2.3 Write tests for ModuleFsRepository in `test/repositories/module-fs.repository.test.ts`
  - [x] 2.3.1 Test successful module listing
  - [x] 2.3.2 Test project src directory not found
  - [x] 2.3.3 Test empty module list
  - [x] 2.3.4 Test git repository detection
  - [x] 2.3.5 Test git remote URL retrieval

## 3. Service Layer
- [x] 3.1 Create `src/services/module-fs.service.ts` with ModuleFsService class
  - [x] 3.1.1 Implement constructor with IModuleFsRepository dependency
  - [x] 3.1.2 Implement listModules(projectName: string) method
  - [x] 3.1.3 Add Zod validation for repository data
- [x] 3.2 Write tests for ModuleFsService in `test/services/module-fs.service.test.ts`
  - [x] 3.2.1 Test successful module listing
  - [x] 3.2.2 Test repository error propagation
  - [x] 3.2.3 Test validation error handling

## 4. Factory Layer
- [x] 4.1 Create `src/factories/module.factory.ts` (or extend existing ProjectFactory)
  - [x] 4.1.1 Implement createModuleFsService() method
  - [x] 4.1.2 Wire ModuleFsRepository with ProjectsDirConfig
  - [x] 4.1.3 Handle configuration errors

## 5. Utility Layer
- [x] 5.1 Create `src/utils/detect-current-project.ts` utility
  - [x] 5.1.1 Implement detectCurrentProject(cwd: string, projectsDir: string) function
  - [x] 5.1.2 Handle path traversal logic
  - [x] 5.1.3 Handle edge cases (outside projects dir, at projects root)
- [x] 5.2 Write tests for detectCurrentProject in `test/utils/detect-current-project.test.ts`
  - [x] 5.2.1 Test detection from module directory
  - [x] 5.2.2 Test detection from nested subdirectory
  - [x] 5.2.3 Test detection failure outside projects structure
  - [x] 5.2.4 Test detection at projects root

## 6. Command Layer
- [x] 6.1 Create `src/commands/project/module/list.ts` command
  - [x] 6.1.1 Define command metadata (description, examples, args)
  - [x] 6.1.2 Implement argument parsing (optional project-name)
  - [x] 6.1.3 Implement current project detection when no arg provided
  - [x] 6.1.4 Obtain service from ModuleFactory
  - [x] 6.1.5 Call service.listModules() and handle Result
  - [x] 6.1.6 Format output using cli-table3
  - [x] 6.1.7 Handle empty results and errors
- [x] 6.2 Write tests for module list command in `test/commands/project/module/list.test.ts`
  - [x] 6.2.1 Test listing with explicit project name
  - [x] 6.2.2 Test listing with current project detection
  - [x] 6.2.3 Test empty module list handling
  - [x] 6.2.4 Test error handling
  - [x] 6.2.5 Test table output format

## 7. Integration and Quality
- [x] 7.1 Build project: `pnpm run build`
- [x] 7.2 Run all tests: `pnpm test`
- [x] 7.3 Verify linting passes: `pnpm run lint`
- [x] 7.4 Test command manually with real project
  - [x] 7.4.1 Test with explicit project name: `./bin/dev.js project module list sflab`
  - [x] 7.4.2 Test with current project detection: `cd ~/projects/sflab/src && ./path/to/bin/dev.js project module list`
  - [x] 7.4.3 Test error cases (non-existent project, outside projects dir)

## 8. Documentation
- [x] 8.1 Update README via oclif: `pnpm run prepack`
- [x] 8.2 Verify command appears in README with examples
- [x] 8.3 Verify all tests pass after README update
