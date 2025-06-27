# MCP Example Tools Guide

This guide explains the example tool that demonstrates key MCP (Model Context Protocol) patterns: elicitation.

## Overview

This example tool serves as a tutorial for developers building MCP servers. It demonstrates:

1. **Elicitation** - How to request additional information from users

## Example Tools

### 1. Elicitation Example (`elicitation_example`)

Demonstrates how servers can request additional information from users during tool execution.

**Use Cases:**
- Requesting user credentials
- Gathering preferences
- Collecting profile information

**Example Usage:**
```json
{
  "tool": "elicitation_example",
  "arguments": {
    "elicitationType": "user_profile",
    "customMessage": "We need your profile info to personalize the experience"
  }
}
```

**Elicitation Types:**
- `user_profile` - Name, email, preferences
- `preferences` - Content types, sort order, NSFW settings
- `credentials` - API keys and secrets

**Key Pattern:**
The tool creates an elicitation request with a JSON schema that defines what information is needed. The client prompts the user and returns their response.


## Implementation Details

### File Locations

- **Tool Handler**: `/src/handlers/tools/`
  - `elicitation-example.ts`

- **Tool Definition**: `/src/constants/tool/`
  - `elicitation-example.ts`

### Adding to Your MCP Server

1. **Copy the pattern** from these example tools
2. **Adapt for your domain** - Replace example data with your API
3. **Define schemas** - Create appropriate JSON schemas
4. **Implement handlers** - Process requests and return responses

### Testing the Examples

You can test these tools using any MCP client:

```bash
# List all tools including examples
mcp-client list-tools

# Call elicitation example
mcp-client call-tool elicitation_example '{"elicitationType": "preferences"}'
```

## Best Practices

### Elicitation
- Keep schemas simple and flat
- Only request essential information
- Provide clear messages to users
- Handle all response types (accept/reject/cancel)


## Extending the Examples

These examples are designed to be modified:

1. **Replace mock data** with real API calls
2. **Add authentication** where needed
3. **Implement actual elicitation** flows

## Additional Resources

- [MCP Elicitation Spec](https://modelcontextprotocol.io/specification/2025-06-18/client/elicitation)
- [MCP Sampling Spec](https://modelcontextprotocol.io/specification/2025-06-18/client/sampling)
- [MCP Tools Spec](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)

These example tools provide a foundation for understanding and implementing advanced MCP patterns in your own servers.