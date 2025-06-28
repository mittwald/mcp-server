#!/bin/bash
# Swarm V2 Worktree Setup Script

echo "Setting up git worktrees for Swarm V2..."

# Create parent directory
mkdir -p ../mittwald-cli-swarm-v2

# Create worktree for each agent
for i in {1..20}; do
    echo "Creating worktree for agent-$i..."
    git worktree add ../mittwald-cli-swarm-v2/agent-$i -b cli-v2-agent-$i
    
    # Copy agent-specific files to worktree
    cp swarm-v2/instructions/agent-$i-instructions.md ../mittwald-cli-swarm-v2/agent-$i/AGENT_INSTRUCTIONS.md
    cp swarm-v2/registry/agent-$i-registry.csv ../mittwald-cli-swarm-v2/agent-$i/MY_REGISTRY.csv
    
    # Copy the swarm-v2 directory to each worktree for registry updates
    cp -r swarm-v2 ../mittwald-cli-swarm-v2/agent-$i/
    
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
