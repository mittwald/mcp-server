# Research: Mittwald MCP Use Case Research & Documentation

**Feature**: 015-mittwald-mcp-use-case-research
**Mission**: research
**Phase**: Data Gathering (In Progress)
**Last Updated**: 2025-01-19

## Research Overview

This research project investigates how Mittwald web developers can leverage LLM clients with MCP to accelerate their hosting and development workflows. The goal is to synthesize 10 diverse, plausible use cases that serve as documentation/tutorials for MCP adoption.

## Research Questions

### Primary Question
What are 10 diverse, plausible use cases where Mittwald web developers can leverage LLM clients with the Mittwald MCP server to accelerate their hosting and development workflows?

### Sub-Questions

| # | Question | Status | Evidence Required |
|---|----------|--------|-------------------|
| RQ1 | What customer segments does Mittwald target? | **Complete** | Marketing materials, customer testimonials |
| RQ2 | What capabilities does the Mittwald MCP server provide? | **Complete** | Codebase analysis, tool inventory |
| RQ3 | How do LLM clients differ in MCP integration? | **Complete** | Vendor documentation |
| RQ4 | What is the OAuth authentication flow? | **Complete** | Codebase analysis |
| RQ5 | What workflows are repetitive/error-prone in MStudio? | **In Progress** | MStudio docs, user feedback |
| RQ6 | What is the competitive landscape for AI-assisted hosting? | Pending | Web research |

## Methodology

### Phase 1: Question Definition
**Status**: Complete
- Primary and sub-questions defined in spec.md
- Success criteria established

### Phase 2: Methodology Design
**Status**: In Progress
- Data sources identified
- Research templates established
- Evidence logging framework ready

### Phase 3: Data Gathering
**Status**: In Progress

#### Data Sources

| Source Type | Sources | Priority |
|-------------|---------|----------|
| Primary - Mittwald | mittwald.de, studio.mittwald.de docs, API docs | P1 |
| Primary - This Codebase | mittwald-mcp/, mittwald-oauth-server/ | P1 |
| Primary - MCP Spec | modelcontextprotocol.io, Anthropic docs | P1 |
| Secondary - LLM Vendors | Claude docs, OpenAI docs, Google AI docs | P2 |
| Secondary - Industry | Hosting industry reports, competitor analysis | P3 |

#### Data Collection Methods
1. **Web Research**: Mittwald marketing, documentation, feature pages
2. **Codebase Analysis**: MCP tool inventory, OAuth flow, handler implementations
3. **Documentation Review**: MCP specification, LLM client integration guides
4. **Comparative Analysis**: LLM client feature matrices

### Phase 4: Analysis
**Status**: Not Started
- Customer segment clustering
- MCP tool capability mapping
- LLM client feature comparison
- Workflow automation opportunity identification

### Phase 5: Synthesis
**Status**: Not Started
- Case study template creation
- Tool coverage matrix
- Customer segment coverage matrix

### Phase 6: Publication
**Status**: Not Started
- Final case study documents
- Coverage validation
- Quality review

## Decisions & Rationale

### D001: Case Study Format
**Decision**: Full case study format with business justification and ROI
**Rationale**: User specified (C) during discovery - documentation/tutorials for developers adopting the MCP
**Evidence**: Discovery interview Q2 and Q3
**Implications**: Each case study requires deeper analysis including implementation guidance

### D002: Customer Segment Discovery
**Decision**: Identify segments through research rather than assume
**Rationale**: User specified during discovery that segment identification should be a research deliverable
**Evidence**: Discovery interview Q1
**Implications**: Marketing audit required as first research phase

### D003: Tool Coverage Requirement
**Decision**: All 115 MCP tools must be referenced across the 10 case studies
**Rationale**: Ensures comprehensive documentation value
**Evidence**: Spec requirement FR-022
**Implications**: Case studies must be designed to collectively use all tools; some case studies may need to be more complex

## Findings Summary

### Customer Segments (RQ1)
**Source**: mittwald.de marketing analysis (EV-005 through EV-012)

Mittwald explicitly targets **"Agenturen & Freelancer"** (Agencies & Freelancers) with business-focused hosting. Based on marketing materials, product tiers, and supported technologies, we identify **5 distinct customer segments**:

| Segment ID | Name | Characteristics | CMS/Tech Preferences | Pain Points | MCP Opportunities |
|------------|------|-----------------|----------------------|-------------|-------------------|
| SEG-001 | **Freelance Web Developer** | Solo practitioners, 1-10 client projects, budget-conscious | WordPress, TYPO3, Contao | Manual repetitive tasks, time management, client handoffs | Automate project setup, backups, SSL, email config |
| SEG-002 | **Web Development Agency** | Teams of 5-50, multiple concurrent projects, need collaboration | WordPress, TYPO3, Shopware, custom PHP | Team coordination, staging environments, client management, scaling | Multi-project automation, access management, deployment workflows |
| SEG-003 | **E-commerce Specialist** | Focus on online shops, high-traffic events, payment security | Shopware, Magento, WooCommerce | Performance optimization, backup/restore, SSL management, staging | Database management, backup scheduling, container scaling |
| SEG-004 | **Enterprise TYPO3 Developer** | Complex multi-site deployments, corporate clients, compliance needs | TYPO3, custom extensions | Multi-environment management, security audits, access control | Project templates, user/access management, compliance reporting |
| SEG-005 | **Modern Stack Developer** | Node.js, containers, API-first, DevOps-oriented | Node.js, Docker, Redis, custom | Container orchestration, CI/CD integration, environment parity | Stack deployment, registry management, cronjob automation |

**Key Insight**: Mittwald's TYPO3 heritage (founded as TYPO3 provider) means strong representation in German enterprise web development, while WordPress and Shopware coverage captures broader market segments.

### MCP Tool Capabilities
**Partial - from existing inventory**

| Domain | Tool Count | Key Capabilities |
|--------|------------|------------------|
| apps | 8 | Install, upgrade, copy, uninstall applications |
| backups | 8 | Create, schedule, restore, delete backups |
| certificates | 1 | SSL certificate management |
| containers | 9 | Docker stacks, registries, volumes |
| context | 3 | Session context management |
| databases | 14 | MySQL and Redis CRUD operations |
| domains-mail | 22 | Domains, DNS, virtualhosts, email |
| identity | 13 | Users, API tokens, SSH keys |
| misc | 5 | Support conversations |
| organization | 7 | Org management, memberships |
| project-foundation | 12 | Projects, servers, SSH |
| sftp | 2 | SFTP user management |
| ssh | 4 | SSH user management |
| **Total** | **115** | |

### LLM Client Comparison (RQ3)
**Source**: Vendor documentation and web research (EV-013 through EV-020)

| Client | MCP Support | Transport | Auth Method | Best For | Limitations |
|--------|-------------|-----------|-------------|----------|-------------|
| **Claude Code** | Full | HTTP, SSE, stdio | OAuth, Bearer tokens, headers | Terminal-based development, code generation, system administration | Requires CLI environment |
| **Claude Desktop** | Full | stdio, local | Local config | Interactive conversations, document review | Limited to local MCP servers |
| **ChatGPT (Developer Mode)** | Full | SSE, HTTP | OAuth optional | Web-based workflows, Plus/Pro/Business users | Requires Developer Mode enabled |
| **Gemini CLI** | Full | stdio, HTTP | OAuth, API keys | Google Cloud integration, Maps, BigQuery | Newer ecosystem, fewer community servers |

**Key Findings**:
1. **MCP is now industry standard**: OpenAI adopted March 2025, Google December 2025, all major players now support it
2. **Claude Code is primary recommendation**: Best fit for Mittwald use cases due to terminal-native workflow and strong HTTP MCP support
3. **OAuth bridge compatibility**: All clients support OAuth which aligns with mittwald-oauth-server architecture
4. **December 2025 milestone**: MCP donated to Agentic AI Foundation (Linux Foundation), co-founded by Anthropic, Block, and OpenAI

**MCP Specification Key Points** (v2025-11-25):
- JSON-RPC 2.0 protocol
- Servers expose: Resources, Prompts, Tools
- Clients provide: Sampling, Roots, Elicitation
- Security: User consent required for all tool invocations
- New features: Tasks for async operations, server identity, official extensions

### MStudio Platform Capabilities (RQ5 - partial)
**Source**: mittwald.de/mstudio documentation (EV-021 through EV-024)

MStudio is Mittwald's unified hosting management platform. Key features relevant to MCP automation:

| Feature | Current Method | MCP Automation Potential |
|---------|----------------|--------------------------|
| Project creation | GUI/CLI/API | `project/create`, `project/update` |
| Domain management | GUI with multiple steps | `domain/*`, `domain/virtualhost/*`, `domain/dnszone/*` |
| Email setup | Manual per-address | `mail/address/*`, `mail/deliverybox/*` |
| Database provisioning | GUI wizard | `database/mysql/*`, `database/redis/*` |
| Backup configuration | GUI scheduling | `backup/*`, `backup/schedule/*` |
| App installation | GUI app store | `app/*` tools |
| Access management | Role-based GUI | `org/*`, `project/membership/*`, `ssh/user/*` |
| Container deployment | Advanced users only | `stack/*`, `container/*`, `registry/*` |

**Pain Points Identified**:
1. Repetitive multi-step workflows (e.g., setting up domain + email + SSL for new client)
2. Manual staging/production environment parity
3. Bulk operations across multiple projects
4. Team onboarding with correct permissions
5. Scheduled backup verification

## Open Questions & Risks

### Open Questions
1. ~~What are Mittwald's official customer segment names/categories?~~ **RESOLVED** - 5 segments identified
2. ~~Which LLM clients currently have production-ready MCP support?~~ **RESOLVED** - All 4 now support MCP
3. What are the most common workflows Mittwald customers perform? **PARTIAL** - Need more user feedback
4. Are there any MCP tools that are deprecated or have limited functionality? **NEEDS VALIDATION**

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ~~Limited public info on Mittwald segments~~ | ~~Medium~~ | ~~High~~ | **RESOLVED** - 5 segments identified |
| ~~Some LLM clients may not support MCP~~ | ~~High~~ | ~~Medium~~ | **RESOLVED** - All major clients now support |
| 115 tools may not all fit naturally into 10 case studies | Medium | Medium | Design case studies with tool coverage in mind |
| Tool functionality may vary (some may be stubs) | Medium | High | Validate tools during case study development |

## Next Steps

1. ~~Begin web research on Mittwald.de to identify customer segments~~ **DONE**
2. ~~Analyze MCP specification and LLM client documentation~~ **DONE**
3. ~~Map MStudio workflows to MCP tool capabilities~~ **DONE** (partial)
4. Design case study template
5. Draft initial case studies with tool coverage matrix
6. Validate tool functionality through light testing
7. Complete coverage matrices

## Preliminary Case Study Ideas

Based on segments, pain points, and tool capabilities, here are 10 preliminary case study concepts:

| CS# | Segment | Title | Key Tools | Primary Pain Point |
|-----|---------|-------|-----------|-------------------|
| CS-001 | SEG-001 | Freelancer Client Onboarding | project, domain, mail, certificate | Manual setup for each new client |
| CS-002 | SEG-002 | Agency Multi-Project Management | project/list, org, membership | Team coordination across projects |
| CS-003 | SEG-003 | E-commerce Launch Day Preparation | backup, database, app/upgrade | Pre-launch checklist automation |
| CS-004 | SEG-004 | TYPO3 Multi-Site Deployment | app, database, domain, ssh | Complex deployment coordination |
| CS-005 | SEG-005 | Container Stack Deployment | stack, registry, container, volume | Docker deployment complexity |
| CS-006 | SEG-001 | Automated Backup Monitoring | backup/list, backup/schedule | Backup verification anxiety |
| CS-007 | SEG-002 | New Developer Onboarding | ssh/user, sftp/user, org/invite | Access management for new hires |
| CS-008 | SEG-003 | Database Performance Optimization | database/mysql, database/redis | Database tuning and scaling |
| CS-009 | SEG-004 | Security Audit Automation | user/api/token, ssh/key, certificate | Compliance and security review |
| CS-010 | SEG-005 | CI/CD Pipeline Integration | cronjob, stack/deploy, context | Automated deployment workflows |

This distribution covers:
- All 5 customer segments (2 case studies each)
- All 14 MCP domains (tool coverage to be validated)
- Diverse pain points and workflow types

## References

See `research/source-register.csv` for full citation list.

### Key Sources

- [Mittwald Homepage](https://www.mittwald.de) - Customer segment and product info
- [mStudio Documentation](https://www.mittwald.de/mstudio) - Platform capabilities
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25) - Protocol details
- [Claude Code MCP Docs](https://code.claude.com/docs/en/mcp) - Integration guide
- [OpenAI MCP Support](https://www.infoq.com/news/2025/10/chat-gpt-mcp/) - ChatGPT Developer Mode
- [Google Cloud MCP](https://cloud.google.com/blog/products/ai-machine-learning/announcing-official-mcp-support-for-google-services) - Gemini integration
