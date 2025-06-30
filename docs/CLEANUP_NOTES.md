# Project Cleanup Notes

## Issue: Project Deletion Delay

The Mittwald API handles project deletion asynchronously. When you call the delete project endpoint, it returns a 204 (No Content) response immediately, but the actual deletion happens in the background.

### Observed Behavior

1. The `deleteProject` API call returns successfully (204 status)
2. The project remains visible in the project list for several seconds to minutes
3. Eventually, the project disappears from the list

### Solution

The test utilities have been updated to handle this:

1. **In `TestProjectManager.deleteProject()`**:
   - Added a 15-second wait after deletion to allow the API to process
   - Added logging to indicate deletion is in progress
   - Handle cases where the API returns errors for already-deleting projects

2. **In `TestProjectManager.cleanup()`**:
   - Increased wait times between operations
   - Added verification step to check if projects were actually deleted
   - Logs warnings if projects still exist after cleanup
   - Total cleanup time increased to accommodate API delays

### Recommendations for Tests

1. Always use the `TestProjectManager` for creating/deleting projects in tests
2. Expect cleanup to take 30-45 seconds per project
3. Don't rely on immediate deletion - always wait after delete operations
4. Consider the cleanup time when setting test timeouts

### API Behavior

The Mittwald API appears to:
- Queue deletion requests
- Process them asynchronously
- May take 10-60 seconds to fully remove a project
- Projects in "deleting" state may still appear in lists

This is normal behavior for cloud infrastructure APIs where resource deletion involves multiple cleanup steps (removing apps, data, DNS entries, etc.).