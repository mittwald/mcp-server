# Debug Handoff: Mittwald CLI Hanging on Fly.io

## Problem Statement

The Mittwald MCP server runs fine locally but exhibits a critical bug on Fly.io: **CLI commands (`mw`) hang after the first 1-2 successful executions**. This prevents the MCP server from functioning properly in production.

## Key Discovery: It's a Resource Leak, Not a Fundamental Hang

### What Works
- ✅ First 1-2 `mw` CLI executions complete successfully (confirmed via logs)
- ✅ `mw --version` works in Alpine Docker container locally
- ✅ `mw --version` works on Fly via SSH (slowly, but completes)
- ✅ Semaphore correctly tracks inflight processes (4 shown when 4 running)
- ✅ Network connectivity and DNS resolution work on Fly

### What Fails
- ❌ After 1-2 successful executions, all subsequent `mw` calls hang indefinitely
- ❌ Hung processes accumulate CPU time (0:01-0:04), indicating active execution, not I/O blocking
- ❌ Processes never complete, timeout doesn't fire
- ❌ `mw` called via `execFile` hangs, even though it works via SSH

### Evidence from Logs
```
[CLI-EXEC] AFTER execFilePromise: project list, got 1875 bytes stdout  # ✅ FIRST REQUEST WORKED
[CLI-EXEC] FINALLY block: project list, releasing slot                # ✅ CLEANUP HAPPENED
[CLI-EXEC] FINALLY complete: project list, slot released              # ✅ SLOT RELEASED
[CLI-EXEC] BEFORE execFilePromise: project list, slot acquired        # ⏳ SECOND REQUEST STARTED
# ... then nothing. Second request hangs forever.
```

## What We've Ruled Out

1. **Not Docker/Alpine issue** - Built identical container locally, `mw` works perfectly
2. **Not stdin issue** - `child.stdin?.end()` is called, and even with stdin redirected to `/dev/null` via SSH it still hangs
3. **Not abort signal issue** - Removed abort signal, still hangs
4. **Not semaphore/concurrency issue** - Metrics show correct tracking, slots release properly
5. **Not network/DNS issue** - Connectivity works, API calls succeed initially
6. **Not timeout config issue** - Timeout is 180s, processes hang longer without timing out
7. **Not server resource exhaustion** - Server has plenty of capacity (1GB RAM, <50% used)
8. **Not shell environment issue** - Tried shell wrapper (`/bin/sh -c`), still hangs

## What We've Tried

### Code Changes (in order)
1. Added `child.stdin?.end()` to close stdin - **No effect**
2. Removed abort signal from execFile - **No effect**
3. Added shell wrapper `/bin/sh -c` - **No effect**
4. Added detailed logging to track execution flow - **Revealed first request succeeds, second hangs**

### Investigations
- Built Alpine container locally - works perfectly
- Tested with resource limits matching Fly - works
- Tested as non-root user - works
- Ran `mw --version` via SSH on Fly - works (slowly)
- Checked for zombie processes - none found
- Checked network connectivity - works fine

## Current Hypothesis

**A resource is leaking after each successful `mw` execution that prevents subsequent executions from completing.**

Possible culprits:
1. **File descriptors** not being closed (stdout/stderr pipes from child process)
2. **Event listeners** accumulating in Node.js event loop
3. **Network connections** being held open by `mw` CLI
4. **oclif framework state** - `mw` uses oclif which may maintain internal state
5. **Fly-specific resource** (cgroup limit, kernel resource, etc.)

## Key Code Locations

### Main CLI Execution Wrapper
`src/utils/cli-wrapper.ts` lines 11-31 (execFilePromise function)
```typescript
async function execFilePromise(
  command: string,
  args: string[],
  options: Parameters<typeof execFile>[2]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        stdout: typeof stdout === 'string' ? stdout : stdout.toString('utf8'),
        stderr: typeof stderr === 'string' ? stderr : stderr.toString('utf8'),
      });
    });

    // Ensure the CLI never blocks on stdin prompts.
    child.stdin?.end();
  });
}
```

### Main Execution Function
`src/utils/cli-wrapper.ts` lines 290-427 (executeCli function with semaphore)

### Current Debug Logging
Lines 376-388, 394-396 - Shows BEFORE/AFTER/FINALLY logs

## Environment Details

### Fly.io Configuration
- **Node version**: v24.11.0 (Alpine)
- **Memory**: 1GB
- **CPU**: 1 shared CPU
- **CLI concurrency**: 5
- **Queue limit**: 50
- **Region**: fra (Frankfurt)

### Local Working Environment
- **Node version**: v25.2.1 (macOS)
- **Same mw CLI version**: 1.12.0
- **Same Alpine container**: node:24.11.0-alpine

## Suggested Next Steps

### 1. Investigate File Descriptor Leak
Check if stdout/stderr streams from child processes aren't being properly closed:
```bash
# On Fly, before and after mw execution:
flyctl ssh console -a mittwald-mcp-fly2 -C "ls -la /proc/643/fd | wc -l"
```

Add explicit stream cleanup in execFilePromise:
```typescript
child.stdout?.on('end', () => console.log('stdout ended'));
child.stderr?.on('end', () => console.log('stderr ended'));
child.on('close', () => console.log('process closed'));
child.on('exit', () => console.log('process exited'));
```

### 2. Check for Event Loop Blocking
Add logging to track event loop lag after each execution:
```typescript
const { performance } = require('perf_hooks');
setInterval(() => {
  const start = performance.now();
  setImmediate(() => {
    const lag = performance.now() - start;
    if (lag > 100) console.log(`Event loop lag: ${lag}ms`);
  });
}, 1000);
```

### 3. Test with spawn() Instead of execFile()
The issue might be specific to execFile's internal buffering. Try child_process.spawn():
```typescript
import { spawn } from 'child_process';

const child = spawn(command, args, {
  stdio: ['ignore', 'pipe', 'pipe'],
  ...options
});

let stdout = '';
let stderr = '';
child.stdout.on('data', (data) => stdout += data);
child.stderr.on('data', (data) => stderr += data);

return new Promise((resolve, reject) => {
  child.on('close', (code) => {
    if (code === 0) resolve({ stdout, stderr });
    else reject(new Error(`Exit code ${code}`));
  });
});
```

### 4. Add Process Cleanup on Timeout
Ensure child process is explicitly killed if callback doesn't fire:
```typescript
const killTimer = setTimeout(() => {
  console.log(`[KILL] Force killing PID ${child.pid}`);
  child.kill('SIGKILL');
}, timeout + 5000);

child.on('exit', () => clearTimeout(killTimer));
```

### 5. Bypass mw CLI Entirely
If nothing else works, replace CLI calls with direct HTTP API calls to Mittwald API:
```typescript
// Instead of: mw project list --output json
// Do: HTTP GET https://api.mittwald.de/v2/projects
```

## How to Test

### Deploy a Change
```bash
git add -A
git commit -m "test: your change description"
git push origin main
# Wait 2 minutes for deployment
```

### Check Logs for Success
```bash
flyctl logs -a mittwald-mcp-fly2 --no-tail | grep "CLI-EXEC"
```

Look for:
- First request: `BEFORE` → `AFTER` → `FINALLY` (success)
- Second request: `BEFORE` → `AFTER` → `FINALLY` (success) ← **This would be the fix!**

### Verify No Hung Processes
```bash
flyctl ssh console -a mittwald-mcp-fly2 -C "ps | grep 'node.*mw'"
```
Should show: No hung processes (or only very recent ones <5s old)

## Critical Files Modified

1. `src/utils/cli-wrapper.ts` - Main CLI execution logic
2. `Dockerfile` - Alpine container with mw CLI
3. `packages/mcp-server/fly.toml` - Fly configuration

## Metrics to Monitor

- `mcp_cli_inflight` - Should drop to 0 after requests complete
- `mcp_cli_queue_depth` - Should stay at 0
- Process count via `ps` - Should not accumulate
- Memory pressure - Currently 93%, monitor if it climbs

## Questions to Answer

1. **What happens to child process stdout/stderr after callback fires?** Are streams being kept open?
2. **Does oclif maintain any global state between invocations?** Could be caching something that blocks.
3. **Is there a Fly-specific kernel/cgroup limit being hit?** Check `/proc/sys` values.
4. **Do network connections from mw CLI close properly?** Use `netstat` before/after.

## Success Criteria

✅ Multiple sequential `mw` calls complete successfully
✅ No hung processes after 10+ tool executions
✅ Logs show `AFTER execFilePromise` for every `BEFORE`
✅ Semaphore slots released properly (inflight returns to 0)

## Last Known Good State

Commit `e96b0060` has all the infrastructure in place (stdin closing, client disconnect handling). The bug exists but infrastructure is solid. Build from there.

## Contact Info

- Fly app: `mittwald-mcp-fly2`
- Region: `fra`
- Logs: `flyctl logs -a mittwald-mcp-fly2`
- SSH: `flyctl ssh console -a mittwald-mcp-fly2`
- Metrics: https://mittwald-mcp-fly2.fly.dev/metrics

Good luck! The answer is close - it's a resource leak after successful executions.
