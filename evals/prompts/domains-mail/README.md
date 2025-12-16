# domains-mail Eval Prompts

This directory contains 21 Langfuse-compatible eval prompts for tools in the domains-mail domain.

## Important Warnings

### DNS Operations (`domain/dnszone/update`)

**DNS WARNING**: The `domain/dnszone/update` tool modifies DNS records which can affect live domains:
- DNS changes may take time to propagate globally (TTL-dependent, typically 5 minutes to 48 hours)
- Exercise caution when testing on production domains
- Prefer using test/staging domains or subdomains
- Note current DNS settings before making changes for potential rollback

### Certificate Operations (`certificate/request`)

**CERTIFICATE PREREQUISITES**: The `certificate/request` tool triggers Let's Encrypt validation:
1. The domain must be properly configured and pointing to the Mittwald server
2. DNS must be propagated (A/AAAA records resolving correctly)
3. HTTP validation requires port 80 accessible, or use DNS validation
4. Let's Encrypt has rate limits - avoid repeated requests for the same domain

## Tool Categories

### domain/ tools (9)
| Tool | Tier | Risk Level |
|------|------|------------|
| `domain/list` | 4 | Low - Read only |
| `domain/get` | 4 | Low - Read only |
| `domain/dnszone/list` | 4 | Low - Read only |
| `domain/dnszone/get` | 4 | Low - Read only |
| `domain/dnszone/update` | 4 | **Medium-High** - DNS affecting |
| `domain/virtualhost-list` | 4 | Low - Read only |
| `domain/virtualhost-get` | 4 | Low - Read only |
| `domain/virtualhost-create` | 4 | Medium - Creates resources |
| `domain/virtualhost-delete` | 4 | **High** - Destructive |

### mail/address/ tools (5)
| Tool | Tier | Risk Level |
|------|------|------------|
| `mail/address/list` | 4 | Low - Read only |
| `mail/address/get` | 4 | Low - Read only |
| `mail/address/create` | 4 | Medium - Creates resources |
| `mail/address/update` | 4 | Medium - Modifies resources |
| `mail/address/delete` | 4 | **High** - Destructive |

### mail/deliverybox/ tools (5)
| Tool | Tier | Risk Level |
|------|------|------------|
| `mail/deliverybox/list` | 4 | Low - Read only |
| `mail/deliverybox/get` | 4 | Low - Read only |
| `mail/deliverybox/create` | 4 | Medium - Creates resources |
| `mail/deliverybox/update` | 4 | Medium - Modifies resources |
| `mail/deliverybox/delete` | 4 | **High** - Destructive |

### certificate/ tools (2)
| Tool | Tier | Risk Level |
|------|------|------------|
| `certificate/list` | 4 | Low - Read only |
| `certificate/request` | 4 | **Medium** - Triggers Let's Encrypt |

## Files

Total: 21 JSON files

- `domain-list.json`
- `domain-get.json`
- `domain-dnszone-list.json`
- `domain-dnszone-get.json`
- `domain-dnszone-update.json`
- `domain-virtualhost-list.json`
- `domain-virtualhost-get.json`
- `domain-virtualhost-create.json`
- `domain-virtualhost-delete.json`
- `mail-address-list.json`
- `mail-address-get.json`
- `mail-address-create.json`
- `mail-address-update.json`
- `mail-address-delete.json`
- `mail-deliverybox-list.json`
- `mail-deliverybox-get.json`
- `mail-deliverybox-create.json`
- `mail-deliverybox-update.json`
- `mail-deliverybox-delete.json`
- `certificate-list.json`
- `certificate-request.json`
