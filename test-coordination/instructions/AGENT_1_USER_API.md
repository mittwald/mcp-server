# Agent-1: User API Testing Instructions

## Your Identity
- **Agent ID:** agent-1-user
- **Domain:** User API (8 tools)
- **Worktree:** /Users/robert/Code/Mittwald/test-user/

## Available MCP Tools
You have access to Puppeteer through these MCP tools:
- `mcp__toolbase__puppeteer_navigate` - Navigate to URLs
- `mcp__toolbase__puppeteer_screenshot` - Take screenshots
- `mcp__toolbase__puppeteer_click` - Click elements
- `mcp__toolbase__puppeteer_fill` - Fill form fields
- `mcp__toolbase__puppeteer_evaluate` - Execute JavaScript
- `mcp__toolbase__puppeteer_hover` - Hover over elements
- `mcp__toolbase__puppeteer_select` - Select dropdown options

## Phase 0: Login Coordination (CRITICAL - DO THIS FIRST)

```bash
# 1. Update your status
echo '{
  "agentId": "agent-1-user",
  "status": "initiating_login",
  "lastUpdate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' > ./coordination/status/agent-1-status.json

# 2. Navigate to Mittwald
mcp__toolbase__puppeteer_navigate({
  "url": "https://studio.mittwald.de",
  "allowDangerous": false,
  "launchOptions": { "headless": false }
})

# 3. Take screenshot of login page
mcp__toolbase__puppeteer_screenshot({
  "name": "login_page_ready",
  "width": 1920,
  "height": 1080
})

# 4. Update status and wait
echo '{
  "agentId": "agent-1-user", 
  "status": "waiting_for_manual_login",
  "message": "Login page loaded. Please perform manual login.",
  "lastUpdate": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}' > ./coordination/status/agent-1-status.json

# 5. Monitor for login completion
while [ ! -f "./coordination/triggers/login-ready.trigger" ]; do
  sleep 10
  echo "Waiting for manual login to complete..."
  
  # Check if logged in by looking for dashboard elements
  LOGGED_IN=$(mcp__toolbase__puppeteer_evaluate({
    "script": "!!document.querySelector('.dashboard-container, .project-list, [data-testid=\"user-menu\"]')"
  }))
  
  if [ "$LOGGED_IN" = "true" ]; then
    echo "Login detected! Creating trigger..."
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Login completed by user" > ./coordination/triggers/login-ready.trigger
    break
  fi
done
```

## Phase 1: User API Testing

### Tool 1: mittwald_user_authenticate
```javascript
// This tool might not need UI validation since we're already logged in
// Document the current session state instead

// Take screenshot of logged-in state
await mcp__toolbase__puppeteer_screenshot({
  name: "user_authenticated_state",
  selector: "body"
});

// Call API to verify authentication
const authResult = await mittwald_user_authenticate({
  email: "your-email@example.com",
  password: "your-password"
});

// Document result
echo "Authentication verified: ${authResult.success}" >> test-results.log
```

### Tool 2: mittwald_user_get_profile
```javascript
// 1. Call API first
const profile = await mittwald_user_get_profile();

// 2. Navigate to profile page
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de/app/profile"
});

// 3. Wait for profile to load
await mcp__toolbase__puppeteer_evaluate({
  script: "new Promise(resolve => {
    const checkProfile = setInterval(() => {
      if (document.querySelector('.profile-name, [data-testid=\"profile-name\"]')) {
        clearInterval(checkProfile);
        resolve(true);
      }
    }, 500);
  })"
});

// 4. Take screenshot before validation
await mcp__toolbase__puppeteer_screenshot({
  name: "user_profile_before_validation",
  selector: ".profile-container, .content-area, main"
});

// 5. Validate UI matches API response
const validation = await mcp__toolbase__puppeteer_evaluate({
  script: `
    const profileName = document.querySelector('.profile-name, [data-testid="profile-name"]')?.textContent?.trim();
    const profileEmail = document.querySelector('.profile-email, [data-testid="profile-email"]')?.textContent?.trim();
    const apiName = '${profile.name || profile.displayName || profile.username}';
    const apiEmail = '${profile.email}';
    
    return {
      nameFound: !!profileName,
      emailFound: !!profileEmail,
      nameMatch: profileName?.includes(apiName) || apiName?.includes(profileName),
      emailMatch: profileEmail === apiEmail,
      uiData: { profileName, profileEmail },
      apiData: { apiName, apiEmail }
    };
  `
});

// 6. Take screenshot after validation
await mcp__toolbase__puppeteer_screenshot({
  name: "user_profile_validated",
  encoded: false
});

// 7. Save validation results
echo "Profile Validation: ${JSON.stringify(validation)}" >> test-results.log
```

### Tool 3: mittwald_user_list_sessions
```javascript
// 1. Call API
const sessions = await mittwald_user_list_sessions();

// 2. Navigate to sessions/security page
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de/app/profile/security"
});

// 3. Wait and screenshot
await new Promise(resolve => setTimeout(resolve, 2000));
await mcp__toolbase__puppeteer_screenshot({
  name: "user_sessions_list",
  selector: ".sessions-list, .security-section, main"
});

// 4. Count UI sessions
const uiSessionCount = await mcp__toolbase__puppeteer_evaluate({
  script: "document.querySelectorAll('.session-item, [data-testid*=\"session\"]').length"
});

// 5. Validate
const validation = {
  apiSessions: sessions.length,
  uiSessions: uiSessionCount,
  match: sessions.length === uiSessionCount
};
```

### Tool 4: mittwald_user_list_api_tokens
```javascript
// Navigate to API tokens section
await mcp__toolbase__puppeteer_navigate({
  url: "https://studio.mittwald.de/app/profile/api-tokens"
});

// Continue similar pattern...
```

## Progress Tracking

Update your status every 2-3 tool completions:
```bash
cat > ./coordination/status/agent-1-status.json << EOF
{
  "agentId": "agent-1-user",
  "status": "testing",
  "progress": {
    "totalTools": 8,
    "completed": 3,
    "failed": 0,
    "inProgress": 1
  },
  "currentTool": "mittwald_user_list_sessions",
  "lastUpdate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
```

## Screenshot Organization

Save all screenshots with proper naming:
```bash
# Copy screenshots to coordination directory
cp *.png ./coordination/screenshots/agent-1-user/

# Naming pattern:
# 20250127_143022_user_get_profile_before.png
# 20250127_143025_user_get_profile_validated.png
# 20250127_143030_user_get_profile_success.png
```

## Error Handling

If a tool fails:
1. Take error screenshot
2. Document the error
3. Continue with next tool
4. Mark as failed in progress

```javascript
try {
  // Test tool
} catch (error) {
  await mcp__toolbase__puppeteer_screenshot({
    name: `error_${toolName}_${Date.now()}`,
    fullPage: true
  });
  
  echo "ERROR in ${toolName}: ${error.message}" >> test-failures.log
  
  // Update progress with failure
  updateProgress({ failed: currentFailed + 1 });
}
```

## Completion

When all tools tested:
1. Create completion trigger
2. Generate final report
3. Push to git

```bash
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): User API testing complete" > ./coordination/triggers/user-api-tested.trigger

# Generate report
cat > ./coordination/reports/agent-1-user-report.md << EOF
# User API Test Report

- Total Tools: 8
- Successful: X
- Failed: Y
- Screenshots: Z

## Detailed Results
[Include test results here]
EOF
```