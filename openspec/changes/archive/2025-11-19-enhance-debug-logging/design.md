# Design: Enhanced Debug Logging

## Problem Statement
Repository methods currently return detailed error context through the Result pattern, but this information is not visible to users when troubleshooting failures. The existing `--log-level` flag is defined in BaseCommand but not actively used for diagnostic output in repository error paths.

## Design Goals
1. **Leverage Existing Infrastructure**: Use the already-defined `--log-level` flag
2. **Non-Invasive**: Don't change error handling patterns or Result types
3. **Reusable**: Create a pattern that can be applied consistently across all repositories
4. **Secure**: Avoid logging sensitive information (tokens, passwords)
5. **Performant**: Only format debug output when actually needed

## Architecture

### Current State
```typescript
// Repository method
async listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>> {
  try {
    // ... implementation
  } catch (error) {
    return failure(
      new RepositoryError('Failed to connect to Proxmox API', {
        cause: error instanceof Error ? error : undefined,
        context: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
    );
  }
}
```

When this error occurs, users only see: "Failed to connect to Proxmox API"

### Proposed State
```typescript
// Repository method
async listTemplates(): Promise<Result<ProxmoxTemplateDTO[], RepositoryError>> {
  try {
    // ... implementation
  } catch (error) {
    // Enhanced debug logging
    logDebugError('Proxmox API error during listTemplates', error, {
      host: this.config.host,
      port: this.config.port,
      // Exclude sensitive data like tokenSecret
    });

    return failure(
      new RepositoryError('Failed to connect to Proxmox API', {
        cause: error instanceof Error ? error : undefined,
        context: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
    );
  }
}
```

With `--log-level debug`, users see:
```
Proxmox API error during listTemplates
Error: connect ECONNREFUSED 192.168.1.100:8006
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1148:16)
Context: {
  host: 'proxmox.home.sflab.io',
  port: 8006
}
Cause: Error: getaddrinfo ENOTFOUND proxmox.home.sflab.io
    at GetAddrInfoReqWrap.onlookup [as oncomplete] (dns.js:66:26)
```

## Implementation Details

### Debug Logger Utility
Create `src/utils/debug-logger.ts`:

```typescript
/**
 * Logs detailed error information when debug log level is active.
 * Checks environment/config for log level to avoid circular dependencies.
 */
export function logDebugError(
  message: string,
  error: unknown,
  context?: Record<string, unknown>
): void {
  // Check log level from environment or global config
  const logLevel = getLogLevel(); // From env or global state

  if (logLevel !== 'debug' && logLevel !== 'trace') {
    return; // Skip debug output at higher log levels
  }

  console.error(`\n[DEBUG] ${message}`);

  if (error instanceof Error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    if ('cause' in error && error.cause) {
      console.error('Cause:', error.cause);
    }
  } else {
    console.error('Error:', error);
  }

  if (context && Object.keys(context).length > 0) {
    console.error('Context:', JSON.stringify(context, null, 2));
  }

  console.error(''); // Empty line for readability
}

function getLogLevel(): string {
  // Option 1: Read from environment variable
  if (process.env.HOMELAB_LOG_LEVEL) {
    return process.env.HOMELAB_LOG_LEVEL;
  }

  // Option 2: Read from CLI config (configstore)
  // Note: Avoid circular dependencies with config module
  try {
    const config = getCliConfig();
    return config.get('logLevel');
  } catch {
    return 'info'; // Default
  }
}
```

### Log Level Access Strategy
The challenge is accessing the log level from repository code without circular dependencies or tight coupling to the command layer.

**Options:**

1. **Environment Variable** (Simplest)
   - BaseCommand sets `process.env.HOMELAB_LOG_LEVEL` in its `init()` method
   - Repositories read from environment
   - Pros: Simple, no dependencies
   - Cons: Global state, less testable

2. **Global Config** (Recommended)
   - Use existing `CliConfigManager` from `src/config/cli.config.ts`
   - Already has `logLevel` setting
   - Already supports `HOMELAB_LOG_LEVEL` environment override
   - Pros: Clean, already exists, testable
   - Cons: Slight dependency on config module

3. **Dependency Injection**
   - Pass logger instance to repositories
   - Pros: Most testable, explicit
   - Cons: Changes repository interfaces, requires factory updates

**Recommendation**: Use Option 2 (Global Config) because:
- The `CliConfigManager` already exists and manages `logLevel`
- It already supports environment variable overrides
- No interface changes needed
- Repositories can import directly without circular deps

### Security Considerations
Sensitive data must be excluded from debug context:
- `tokenSecret` - Never log API tokens
- `password` - Never log passwords
- `privateKey` - Never log private keys

Pattern:
```typescript
logDebugError('API call failed', error, {
  host: this.config.host,
  port: this.config.port,
  user: this.config.user,
  // tokenSecret: EXCLUDED
});
```

### Testing Strategy

**Unit Tests**:
```typescript
describe('logDebugError', () => {
  it('should output debug info when log level is debug', () => {
    // Set log level to debug
    // Call logDebugError
    // Verify console.error was called with stack trace
  });

  it('should suppress output when log level is info', () => {
    // Set log level to info
    // Call logDebugError
    // Verify console.error was NOT called
  });
});
```

**Integration Tests**:
```typescript
describe('ProxmoxApiRepository with debug logging', () => {
  it('should log debug info on API error when --log-level debug', async () => {
    // Mock Proxmox API to throw error
    // Set HOMELAB_LOG_LEVEL=debug
    // Call repository method
    // Verify debug output contains stack trace
  });
});
```

## Alternative Approaches Considered

### 1. Structured Logging Framework (Winston/Pino)
**Rejected because**:
- Adds significant dependency weight
- Overkill for CLI tool
- Current solution is sufficient

### 2. New `--debug` Flag
**Rejected because**:
- `--log-level` flag already exists in BaseCommand
- Redundant with existing functionality
- Would create confusion about which flag to use

### 3. Debug Output in Error Messages
**Rejected because**:
- Would clutter error messages at all log levels
- Users expect concise messages by default
- Debug info should be opt-in

## Migration Path
This is a purely additive change:
1. Add debug logger utility
2. Add debug logging calls to repository catch blocks
3. No breaking changes to APIs or interfaces
4. Existing error handling remains unchanged

## Open Questions
1. **Should we log at method entry/exit in debug mode?**
   - Current proposal: Only log on errors
   - Alternative: Log all method calls with parameters
   - Decision: Start with errors only, expand if needed

2. **Should we sanitize context automatically?**
   - Current proposal: Manual exclusion of sensitive fields
   - Alternative: Auto-detect and redact fields matching patterns (token, secret, password, key)
   - Decision: Manual for now (more explicit), auto-sanitize if issues arise

## Success Metrics
- All repository methods include debug logging
- `--log-level debug` shows stack traces for all errors
- No sensitive data appears in debug output
- Debug logging adds <5ms overhead to error paths
