#!/bin/bash

echo "Checking all agent branches for uncommitted work..."
echo "================================================"

for i in {1..20}; do
    branch="cli-migration-agent-$i"
    echo -e "\n### Checking $branch"
    
    # Check if branch exists
    if git show-ref --verify --quiet refs/heads/$branch; then
        # Switch to branch
        git checkout $branch -q 2>/dev/null
        
        # Check for uncommitted changes
        changes=$(git status --porcelain | grep -v SWARM_RESCUE_LOG.md | grep -v check_agent_branches.sh)
        
        if [ -n "$changes" ]; then
            echo "FOUND UNCOMMITTED WORK:"
            echo "$changes" | head -10
            echo "Total changes: $(echo "$changes" | wc -l) files"
        else
            # Check for commits not in main
            commits=$(git log main..$branch --oneline)
            if [ -n "$commits" ]; then
                echo "FOUND COMMITS:"
                echo "$commits"
            else
                echo "No changes found"
            fi
        fi
    else
        echo "Branch does not exist"
    fi
done

# Return to main
git checkout main -q 2>/dev/null
echo -e "\n\nDone checking all branches."