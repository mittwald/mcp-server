# SWARM SETUP SCRIPT

## Pre-Swarm Setup Tasks

### 1. Archive Current State
```bash
#!/bin/bash
# Run from project root

# Create archive tag
git add -A
git commit -m "Pre-CLI migration state"
git tag -a v1.0.0-raw-api -m "Last version with raw API approach before CLI alignment"
git push origin v1.0.0-raw-api

# Create archive branch
git checkout -b archive/v1-raw-api
git push origin archive/v1-raw-api
git checkout main
```

### 2. Create Directory Structure
```bash
# Create swarm directories
mkdir -p swarm-cli-mapping/{registry,instructions,reports,analysis,coordination}
mkdir -p cli-commands/{app,backup,context,cronjob,database,domain,mail,org,project,server,ssh-key,user}
mkdir -p src/handlers/tools/mittwald-cli/{app,backup,context,cronjob,database,domain,mail,org,project,server,ssh-key,user}
mkdir -p src/constants/tool/mittwald-cli/{app,backup,context,cronjob,database,domain,mail,org,project,server,ssh-key,user}
mkdir -p tests/mittwald-cli/{app,backup,context,cronjob,database,domain,mail,org,project,server,ssh-key,user}

# Create agent directories
for i in {1..20}; do
  mkdir -p swarm-cli-mapping/analysis/agent-$i
done
```

### 3. Initialize Master Registry
```bash
# Create master registry header
echo "command_category,command_subcommand,command_action,cli_command_file,mcp_tool_name,required_params,optional_params,assigned_agent,priority,status,notes" > swarm-cli-mapping/registry/master-registry.csv
```

### 4. Command Processing Script
```python
#!/usr/bin/env python3
# process_cli_commands.py

import os
import csv
import re
from pathlib import Path

def extract_command_info(file_path):
    """Extract command info from individual command file"""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Extract command pattern
    command_match = re.search(r'mw\s+([^\n]+)', content)
    if command_match:
        command_parts = command_match.group(1).split()
        return command_parts
    return []

def generate_mcp_tool_name(command_parts):
    """Generate MCP tool name from command parts"""
    return 'mittwald_' + '_'.join(command_parts)

def assign_agent(index, total_commands):
    """Distribute commands among 20 agents"""
    commands_per_agent = total_commands // 20
    agent_num = (index // commands_per_agent) + 1
    return min(agent_num, 20)  # Cap at 20

def process_cli_commands():
    cli_dir = Path('cli-commands')
    commands = []
    
    # Walk through cli-commands directory
    for category_dir in cli_dir.iterdir():
        if category_dir.is_dir():
            category = category_dir.name
            for cmd_file in category_dir.glob('*.md'):
                command_info = {
                    'category': category,
                    'file': str(cmd_file),
                    'command_parts': extract_command_info(cmd_file)
                }
                commands.append(command_info)
    
    # Sort for consistent distribution
    commands.sort(key=lambda x: x['file'])
    
    # Generate registry entries
    registry_entries = []
    for idx, cmd in enumerate(commands):
        if cmd['command_parts']:
            mcp_name = generate_mcp_tool_name([cmd['category']] + cmd['command_parts'])
            entry = {
                'command_category': cmd['category'],
                'command_subcommand': cmd['command_parts'][0] if len(cmd['command_parts']) > 0 else '',
                'command_action': ' '.join(cmd['command_parts'][1:]) if len(cmd['command_parts']) > 1 else '',
                'cli_command_file': cmd['file'],
                'mcp_tool_name': mcp_name,
                'required_params': '',  # To be filled by agents
                'optional_params': '',  # To be filled by agents
                'assigned_agent': f'agent-{assign_agent(idx, len(commands))}',
                'priority': 'normal',
                'status': 'pending',
                'notes': ''
            }
            registry_entries.append(entry)
    
    return registry_entries

# Note: This script should be run AFTER cli-commands directory is fully populated
```

### 5. Agent Registry Initialization
```bash
# Create individual agent registries
for i in {1..20}; do
  echo "command_path,mcp_tool_name,cli_implementation_path,status,implementation_file,test_file,errors,completion_time" > swarm-cli-mapping/registry/agent-$i-registry.csv
done
```

### 6. Clean Current Implementation
```bash
# Remove all existing Mittwald tools (CAREFUL - ensure you've archived first!)
rm -rf src/handlers/tools/mittwald/
rm -rf src/constants/tool/mittwald/

# Remove Reddit tools we don't need
rm -f src/handlers/tools/get-*.ts
rm -f src/constants/tool/get-*.ts
rm -f src/handlers/tools/search-reddit.ts
rm -f src/constants/tool/search-reddit.ts
```

### 7. Update Base Files
Create new index files for CLI-based tools:

```typescript
// src/handlers/tools/mittwald-cli/index.ts
export * from './app/index.js';
export * from './backup/index.js';
export * from './context/index.js';
export * from './cronjob/index.js';
export * from './database/index.js';
export * from './domain/index.js';
export * from './mail/index.js';
export * from './org/index.js';
export * from './project/index.js';
export * from './server/index.js';
export * from './ssh-key/index.js';
export * from './user/index.js';
```

## SWARM LAUNCH SEQUENCE

### Phase 1: Preparation (Before Swarm)
1. Ensure cli-commands directory is fully populated
2. Run archive script
3. Run directory creation script
4. Run command processing script to generate master registry
5. Clean current implementation

### Phase 2: Agent Assignment
1. Distribute master registry entries to agent registries
2. Create individual agent instruction files with their specific commands
3. Set up agent branches:
   ```bash
   for i in {1..20}; do
     git checkout -b cli-migration-agent-$i
     git checkout main
   done
   ```

### Phase 3: Swarm Launch
1. Each agent gets:
   - Their instruction file: `swarm-cli-mapping/instructions/agent-{N}-instructions.md`
   - Their registry: `swarm-cli-mapping/registry/agent-{N}-registry.csv`
   - Access to CLI source: `/Users/robert/Code/Mittwald/cli`
   - Their specific command files from `cli-commands/`

### Phase 4: Coordination Rules
1. Agents work independently but update registries every 2 hours
2. Daily sync meeting (async via report files)
3. Blocking issues reported immediately
4. Cross-agent dependencies tracked in coordination files

## CRITICAL SUCCESS FACTORS

1. **Wait for cli-commands population**: Don't start until all commands are extracted
2. **Perfect mapping**: Every CLI command must have exactly one MCP tool
3. **No creativity**: Agents must copy, not improve
4. **Continuous integration**: Merge working code daily
5. **Test everything**: Each tool must be tested against real API

## MONITORING DASHBOARD

Create a simple Python script to monitor progress:
```python
# monitor_progress.py
import csv
import glob
from collections import Counter

def get_progress():
    status_count = Counter()
    
    for registry_file in glob.glob('swarm-cli-mapping/registry/agent-*-registry.csv'):
        with open(registry_file, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                status_count[row['status']] += 1
    
    total = sum(status_count.values())
    completed = status_count['completed']
    
    print(f"Progress: {completed}/{total} ({completed/total*100:.1f}%)")
    print(f"Status breakdown: {dict(status_count)}")

if __name__ == "__main__":
    get_progress()
```