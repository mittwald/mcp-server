#!/usr/bin/env python3
"""
Prepare Swarm V2 by filtering out completed tools and creating new assignments
"""

import os
import csv
import json
from datetime import datetime
from pathlib import Path

# Tools that were successfully implemented in V1
COMPLETED_TOOLS = {
    'mittwald_app_install_wordpress',
    'mittwald_app_install_joomla', 
    'mittwald_app_install_typo3',
    'mittwald_app_install_shopware5',
    'mittwald_app_install_shopware6',
    'mittwald_app_install_nextcloud',
    'mittwald_app_install_matomo',
    'mittwald_domain_virtualhost_list',
    'mittwald_extension_list',
    'mittwald_extension_install',
    'mittwald_extension_uninstall',
    'mittwald_extension_list_installed',
    'mittwald_login_reset',
    'mittwald_project_create',
    'mittwald_project_delete',
    'mittwald_project_get',
    'mittwald_project_filesystem_usage',
    'mittwald_project_invite_get'
}

def load_all_commands():
    """Load all CLI commands from the cli-commands directory"""
    commands = []
    cli_dir = Path('/Users/robert/Code/Mittwald/cli-commands')
    
    for cmd_file in sorted(cli_dir.glob('mw-*.md')):
        # Extract command from filename (e.g., mw-app-install-wordpress.md)
        filename = cmd_file.stem  # removes .md
        parts = filename.split('-')
        
        if len(parts) < 2 or parts[0] != 'mw':
            continue
        
        # Build MCP tool name
        mcp_parts = ['mittwald'] + parts[1:]
        mcp_tool_name = '_'.join(mcp_parts)
        
        # Skip if already completed
        if mcp_tool_name in COMPLETED_TOOLS:
            print(f"Skipping completed tool: {mcp_tool_name}")
            continue
        
        # Extract command structure
        category = parts[1] if len(parts) > 1 else ''
        subcommand = parts[2] if len(parts) > 2 else ''
        action = parts[3] if len(parts) > 3 else ''
        
        # Handle nested subcommands (e.g., app-install-wordpress)
        if len(parts) > 4:
            subcommand = '-'.join(parts[2:-1])
            action = parts[-1]
        
        commands.append({
            'command_category': category,
            'command_subcommand': subcommand,
            'command_action': action,
            'cli_command_file': cmd_file.name,
            'mcp_tool_name': mcp_tool_name,
            'command_path': '/'.join(parts[1:]),
            'cli_path': str(cmd_file)
        })
    
    return commands

def create_registries(commands):
    """Create master and agent registries for remaining commands"""
    
    # Create directories
    os.makedirs('swarm-v2/registry', exist_ok=True)
    os.makedirs('swarm-v2/instructions', exist_ok=True)
    
    # Calculate distribution
    num_agents = 20
    commands_per_agent = len(commands) // num_agents
    remainder = len(commands) % num_agents
    
    print(f"\nDistributing {len(commands)} remaining commands among {num_agents} agents")
    print(f"Base: {commands_per_agent} commands per agent, with {remainder} agents getting 1 extra")
    
    # Create master registry
    master_path = 'swarm-v2/registry/master-registry-v2.csv'
    with open(master_path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['command_path', 'mcp_tool_name', 'cli_file', 'assigned_agent', 'status'])
        
        agent_assignments = {}
        cmd_index = 0
        
        for agent_num in range(1, num_agents + 1):
            agent_name = f'agent-{agent_num}'
            agent_assignments[agent_name] = []
            
            # Calculate how many commands this agent gets
            agent_cmd_count = commands_per_agent
            if agent_num <= remainder:
                agent_cmd_count += 1
            
            # Assign commands
            for _ in range(agent_cmd_count):
                if cmd_index < len(commands):
                    cmd = commands[cmd_index]
                    cmd['assigned_agent'] = agent_name
                    agent_assignments[agent_name].append(cmd)
                    
                    writer.writerow([
                        cmd['command_path'],
                        cmd['mcp_tool_name'],
                        cmd['cli_command_file'],
                        agent_name,
                        'pending'
                    ])
                    cmd_index += 1
    
    # Create individual agent registries
    for agent_name, agent_commands in agent_assignments.items():
        agent_num = agent_name.split('-')[1]
        registry_path = f'swarm-v2/registry/agent-{agent_num}-registry.csv'
        
        with open(registry_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['command_path', 'mcp_tool_name', 'status', 'commit_hash', 'completion_time', 'notes'])
            
            for cmd in agent_commands:
                writer.writerow([
                    cmd['command_path'],
                    cmd['mcp_tool_name'],
                    'pending',
                    '',
                    '',
                    f"CLI: {cmd['cli_path']}"
                ])
        
        print(f"{agent_name}: {len(agent_commands)} commands")
    
    return agent_assignments

def create_agent_instructions(agent_assignments):
    """Create specific instructions for each agent"""
    
    template_path = 'SWARM_V2_AGENT_TEMPLATE.md'
    with open(template_path, 'r') as f:
        template = f.read()
    
    for agent_name, commands in agent_assignments.items():
        agent_num = agent_name.split('-')[1]
        
        # Build command list
        tool_list = f"You have been assigned {len(commands)} tools to implement:\\n\\n"
        for i, cmd in enumerate(commands, 1):
            tool_list += f"{i}. **{cmd['mcp_tool_name']}**\\n"
            tool_list += f"   - Command: `mw {cmd['command_path']}`\\n"
            tool_list += f"   - CLI File: `{cmd['cli_path']}`\\n\\n"
        
        # Replace placeholders
        instructions = template.replace('{NUMBER}', agent_num)
        instructions = instructions.replace('[TOOL_LIST_PLACEHOLDER]', tool_list)
        
        # Write instructions
        output_path = f'swarm-v2/instructions/agent-{agent_num}-instructions.md'
        with open(output_path, 'w') as f:
            f.write(instructions)
    
    print(f"\\nCreated instructions for {len(agent_assignments)} agents")

def create_worktree_setup_script():
    """Create script to set up git worktrees"""
    
    script_content = '''#!/bin/bash
# Swarm V2 Worktree Setup Script

echo "Setting up git worktrees for Swarm V2..."

# Create parent directory
mkdir -p ../mittwald-cli-swarm-v2
cd ..

# Create worktree for each agent
for i in {1..20}; do
    echo "Creating worktree for agent-$i..."
    git -C mittwald-typescript-mcp-systempromptio worktree add ../mittwald-cli-swarm-v2/agent-$i -b cli-v2-agent-$i
    
    # Copy agent-specific files to worktree
    cp mittwald-typescript-mcp-systempromptio/swarm-v2/instructions/agent-$i-instructions.md ../mittwald-cli-swarm-v2/agent-$i/AGENT_INSTRUCTIONS.md
    cp mittwald-typescript-mcp-systempromptio/swarm-v2/registry/agent-$i-registry.csv ../mittwald-cli-swarm-v2/agent-$i/MY_REGISTRY.csv
    
    # Initialize progress log
    echo "Agent $i initialized at $(date)" > ../mittwald-cli-swarm-v2/agent-$i/progress.log
done

echo "Worktree setup complete!"
echo ""
echo "Each agent should:"
echo "1. cd ../mittwald-cli-swarm-v2/agent-{NUMBER}"
echo "2. Read AGENT_INSTRUCTIONS.md"
echo "3. Start implementing assigned tools"
echo "4. COMMIT AFTER EACH TOOL!"
'''
    
    with open('swarm-v2/setup_worktrees.sh', 'w') as f:
        f.write(script_content)
    
    os.chmod('swarm-v2/setup_worktrees.sh', 0o755)
    print("Created worktree setup script")

def main():
    print("=== Preparing Swarm V2 ===")
    print(f"Filtering out {len(COMPLETED_TOOLS)} completed tools...")
    
    # Load and filter commands
    commands = load_all_commands()
    print(f"Found {len(commands)} remaining commands to implement")
    
    # Create registries
    agent_assignments = create_registries(commands)
    
    # Create instructions
    create_agent_instructions(agent_assignments)
    
    # Create setup script
    create_worktree_setup_script()
    
    print("\n=== Summary ===")
    print(f"Total remaining commands: {len(commands)}")
    print(f"Commands per agent: ~{len(commands)//20}")
    print(f"Completed tools from V1: {len(COMPLETED_TOOLS)}")
    print("\nNext steps:")
    print("1. Run: ./swarm-v2/setup_worktrees.sh")
    print("2. Each agent works in their assigned worktree")
    print("3. Agents MUST commit after each tool!")

if __name__ == "__main__":
    main()