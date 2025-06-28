#!/bin/bash

echo "=== SWARM V2 STATUS REPORT ==="
echo "Generated at: $(date)"
echo ""

total_commits=0
agents_with_commits=0
tools_completed=0

for i in {1..20}; do
    branch="cli-v2-agent-$i"
    
    # Count commits
    commits=$(git log main..$branch --oneline 2>/dev/null | wc -l | tr -d ' ')
    
    # Get progress log
    progress=$(cat ../mittwald-cli-swarm-v2/agent-$i/progress.log 2>/dev/null | tail -5)
    
    # Check registry for completed tools
    completed=$(grep -c "completed" ../mittwald-cli-swarm-v2/agent-$i/MY_REGISTRY.csv 2>/dev/null || echo 0)
    
    if [ $commits -gt 0 ]; then
        echo "=== Agent $i - $commits commits, $completed tools completed ==="
        git log main..$branch --oneline | head -3
        echo "Latest progress:"
        echo "$progress" | tail -3
        echo ""
        
        agents_with_commits=$((agents_with_commits + 1))
        total_commits=$((total_commits + commits))
        tools_completed=$((tools_completed + completed))
    fi
done

echo "=== SUMMARY ==="
echo "Active agents: $agents_with_commits/20"
echo "Total commits: $total_commits"
echo "Tools completed: $tools_completed"
echo ""

# Check for any errors or issues
echo "=== CHECKING FOR ISSUES ==="
for i in {1..20}; do
    if grep -q "error\|Error\|ERROR" ../mittwald-cli-swarm-v2/agent-$i/progress.log 2>/dev/null; then
        echo "Agent $i reported errors:"
        grep -i "error" ../mittwald-cli-swarm-v2/agent-$i/progress.log | tail -3
        echo ""
    fi
done