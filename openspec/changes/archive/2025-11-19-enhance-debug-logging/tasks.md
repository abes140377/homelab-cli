# Tasks

## Implementation Tasks

### 1. Implement Debug Logging in ProxmoxApiRepository.listTemplates()
- [x] Add debug logging to the catch block in `listTemplates()` method
- [x] Log full error details including stack trace, cause, and context
- [x] Access log level from BaseCommand through dependency injection or global config
- [x] Test by triggering an error with `--log-level debug` flag
- [x] Verify stack trace appears in console output
- **Validation**: Error with debug flag shows full stack trace; error without debug flag shows concise message ✅
- **Dependencies**: None
- **Estimated effort**: 30 minutes

### 2. Extract Debug Logging Pattern to Utility Function
- [x] Create `src/utils/debug-logger.ts` with reusable debug logging function
- [x] Function should check log level and conditionally output detailed error information
- [x] Include formatting for stack traces, causes, and context
- [x] Write unit tests for the utility function
- **Validation**: Unit tests pass; utility can be imported and used ✅
- **Dependencies**: Task 1 (to establish the pattern)
- **Estimated effort**: 45 minutes

### 3. Apply Debug Logging to All ProxmoxApiRepository Methods
- [x] Update `cloneFromTemplate()` catch block
- [x] Update `getNextAvailableVmid()` catch block
- [x] Update `listResources()` catch block
- [x] Update `setVMConfig()` catch block
- [x] Update `waitForTask()` catch block
- [x] Use the debug logger utility from Task 2
- **Validation**: Each method logs debug information when errors occur with debug flag ✅
- **Dependencies**: Task 2
- **Estimated effort**: 45 minutes

### 4. Apply Debug Logging to ProjectFsRepository Methods
- [x] Update `findAll()` catch block
- [x] Update `findByName()` catch block
- [x] Update `createProjectDto()` catch block
- [x] Use the debug logger utility from Task 2
- **Validation**: Each method logs debug information when errors occur with debug flag ✅
- **Dependencies**: Task 2
- **Estimated effort**: 30 minutes

### 5. Apply Debug Logging to ModuleFsRepository Methods
- [x] Update `findByProjectName()` catch block
- [x] Update `createModuleDto()` catch block
- [x] Use the debug logger utility from Task 2
- **Validation**: Each method logs debug information when errors occur with debug flag ✅
- **Dependencies**: Task 2
- **Estimated effort**: 30 minutes

### 6. Add Integration Tests for Debug Logging
- [x] Create test file `test/utils/debug-logger.test.ts`
- [x] Test debug logging with `--log-level debug` flag
- [x] Test that debug logging is suppressed at other log levels
- [x] Verify stack traces appear in debug output
- **Validation**: All tests pass ✅
- **Dependencies**: Tasks 2-5
- **Estimated effort**: 45 minutes

### 7. Update Documentation
- [x] Add debug logging section to `CLAUDE.md`
- [x] Document the debug logging pattern for future contributors
- [x] Add examples of using `--log-level debug` for troubleshooting
- [x] Update command help text if needed
- **Validation**: Documentation is clear and accurate ✅
- **Dependencies**: Tasks 1-6
- **Estimated effort**: 30 minutes

## Total Estimated Effort
~4 hours

## Parallel Work Opportunities
- Tasks 3, 4, and 5 can be done in parallel after Task 2 is complete
- Task 6 can be started after Task 2 is complete (in parallel with 3-5)

## Implementation Summary

All tasks have been completed successfully:

1. ✅ **Proof of Concept**: Implemented debug logging in `ProxmoxApiRepository.listTemplates()` with manual testing verification
2. ✅ **Utility Function**: Created `src/utils/debug-logger.ts` with comprehensive unit tests (13 passing tests)
3. ✅ **Repository Coverage**: Applied debug logging to all repository methods across:
   - ProxmoxApiRepository (6 methods)
   - ProjectFsRepository (3 methods)
   - ModuleFsRepository (2 methods)
4. ✅ **Testing**: All 248 tests passing, including new debug logger tests
5. ✅ **Documentation**: Added comprehensive debug logging section to `CLAUDE.md`
6. ✅ **Security**: Sensitive data (tokens, passwords, keys) explicitly excluded from debug output

The debug logging feature is now fully operational and can be used with `--log-level debug` or `HOMELAB_LOG_LEVEL=debug` environment variable.
