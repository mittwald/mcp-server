# Response Size Logging

## Overview

The MCP server implements response size logging to help diagnose issues where large responses might cause client crashes. This logging system tracks the size of all HTTP responses and provides detailed information about potentially problematic large responses.

## Features

### 1. Automatic Response Size Tracking
- Captures the size of all HTTP responses in bytes
- Logs response sizes in human-readable format (Bytes, KB, MB, GB)
- Tracks response duration for performance monitoring

### 2. Smart Logging Levels
- **DEBUG**: Responses < 10KB (except MCP endpoints)
- **INFO**: 
  - All MCP endpoint responses
  - Responses > 10KB
  - Tool list responses with tool count
- **WARN**: Responses > 500KB (potential crash risk)

### 3. Detailed Logging Information
Each log entry includes:
- Method/endpoint name
- Session ID (for MCP requests)
- Response size (bytes and formatted)
- Response duration
- Request path
- HTTP status code

### 4. Special Tool List Monitoring
The tool list endpoint gets special attention with additional logging:
```
[INFO] 🔧 Tool list response: 170 tools, 115.2 KB
```

## Example Log Output

```
[Response Logger] Middleware attached for GET /health
[DEBUG] 📊 Response size {"method":"/health","sessionId":"n/a","size":99,"sizeFormatted":"99 Bytes","duration":"4ms","path":"/health","statusCode":200}

[Response Logger] Middleware attached for POST /mcp
[INFO] 📊 Response size {"method":"tools/list","sessionId":"session_1234","size":117964,"sizeFormatted":"115.2 KB","duration":"45ms","path":"/mcp","statusCode":200}
[INFO] 🔧 Tool list response: 170 tools, 115.2 KB
```

## Configuration

Response logging is automatically enabled. To see DEBUG level logs, set:
```bash
DEBUG=true
```

## Monitoring for Client Crashes

When clients crash, check the Docker logs for large responses:

```bash
# Check for large responses
docker logs <container-name> 2>&1 | grep -E "(Large response|> 100KB)"

# Check all response sizes
docker logs <container-name> 2>&1 | grep "Response size"

# Check tool list responses specifically
docker logs <container-name> 2>&1 | grep "Tool list response"
```

## Implementation Details

The response logging is implemented as Express middleware that:
1. Intercepts all response methods (`send`, `json`, `write`, `end`)
2. Buffers response data to calculate size
3. Logs based on size thresholds
4. Preserves original response behavior

## Future Improvements

Based on the response size data, you might want to:
1. Enable tool filtering to reduce the tool list size
2. Implement response compression
3. Add response size limits
4. Implement pagination for large responses

## Related Configuration

To reduce tool list response size, you can enable tool filtering:
```env
TOOL_FILTER_ENABLED=true
MAX_TOOLS_PER_RESPONSE=50
ALLOWED_TOOL_CATEGORIES=app,project,database
```