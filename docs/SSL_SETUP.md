# SSL Certificate Setup for Development

## Problem
Claude Code requires HTTPS for remote MCP servers but doesn't trust self-signed certificates. This causes connection failures when trying to connect to `https://localhost:3000/mcp`.

## Solution

### Step 1: Install and Trust mkcert CA

```bash
# Install mkcert (if not already installed)
brew install mkcert

# Install the mkcert CA in system trust stores
mkcert -install
```

### Step 2: Verify System Trust

The mkcert CA should now be trusted by:
- ✅ **System Keychain** (macOS System)
- ✅ **Firefox** 
- ❓ **Chrome/Safari** (uses system keychain)
- ❓ **Node.js applications** (may vary)
- ❓ **Claude Code** (unknown certificate store)

### Step 3: Test Certificate Trust

```bash
# Test with curl (should work without -k flag)
curl https://localhost:3000/health

# If it works: ✅ Certificate is trusted by system
# If it fails: ❌ Need additional setup
```

### Step 4: Alternative Solutions

#### Option A: Add CA to Node.js Certificate Store
```bash
# Set NODE_EXTRA_CA_CERTS environment variable
export NODE_EXTRA_CA_CERTS="/Users/robert/Library/Application Support/mkcert/rootCA.pem"

# Or add to Claude Code configuration if supported
```

#### Option B: Manual Certificate Trust (macOS)
```bash
# Open Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Import the CA certificate
security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain "/Users/robert/Library/Application Support/mkcert/rootCA.pem"
```

#### Option C: Use Different Domain
Instead of localhost, use a domain that resolves to 127.0.0.1:
- `https://127.0.0.1:3000/mcp` (if Claude Code accepts IP addresses)
- `https://local.example.com:3000/mcp` (requires /etc/hosts entry)

### Step 5: Claude Code Specific Solutions

#### Check Claude Code Documentation
Look for:
- Certificate trust options
- SSL/TLS configuration
- Development mode settings
- Custom CA certificate support

#### Environment Variables
Try setting these before running Claude Code:
```bash
# Disable SSL verification (NOT RECOMMENDED for production)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Or specify custom CA bundle
export SSL_CERT_FILE="/Users/robert/Library/Application Support/mkcert/rootCA.pem"
export SSL_CERT_DIR="/Users/robert/Library/Application Support/mkcert/"
```

## Current Certificate Details

**Location**: `/Users/robert/Code/mittwald-mcp/ssl/`
**Files**:
- `localhost+2.pem` (Certificate)
- `localhost+2-key.pem` (Private Key)

**Valid for**:
- `localhost`
- `127.0.0.1` 
- `::1` (IPv6 localhost)

**Expires**: November 5, 2027

## Testing

1. **Basic connectivity**: `curl -k https://localhost:3000/health`
2. **Certificate trust**: `curl https://localhost:3000/health` (no -k flag)
3. **MCP endpoint**: Use Claude Code to connect to `https://localhost:3000/mcp`

## Troubleshooting

### If curl still fails with certificate error:
```bash
# Re-install mkcert CA
mkcert -uninstall
mkcert -install

# Check system keychain
security find-certificate -a -c "mkcert"
```

### If Claude Code still crashes:
1. Check Claude Code logs for SSL errors
2. Try different hostname formats:
   - `https://localhost:3000/mcp`
   - `https://127.0.0.1:3000/mcp`
3. Look for Claude Code SSL configuration options
4. Contact Claude Code support for certificate trust guidance