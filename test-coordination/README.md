# 🧪 Test Coordination Hub

This directory serves as the central coordination point for the 14-agent functional testing swarm.

## 📂 Directory Structure

- **`consolidated-screenshots/`** - All proof screenshots from agent worktrees
- **`reports/`** - Final test reports from each agent
- **`wave-status.txt`** - Real-time wave coordination and status
- **`project-assignments.txt`** - Project ID assignments for Wave 3 agents

## 🔗 Symlink Access

Each agent's worktree creates a symlink to this directory:
```bash
# From each worktree: /Users/robert/Code/Mittwald/test-{domain}/
ln -s /Users/robert/Code/Mittwald/mittwald-typescript-mcp-systempromptio/test-coordination ./coordination
```

## 📊 Wave Coordination

### Wave Status Tracking
```bash
# Check current wave status
cat wave-status.txt

# Agents update status when starting/completing
echo "Wave X Agent-Y: STARTED at $(date)" >> wave-status.txt
echo "Wave X Agent-Y: COMPLETED at $(date)" >> wave-status.txt
```

### Project Assignments (Wave 3)
```bash
# Agent-2 creates projects and shares IDs
echo "test-project-db: project-uuid" > project-assignments.txt
echo "test-project-mail: project-uuid" >> project-assignments.txt
# ... etc

# Wave 3 agents read their assigned project
PROJECT_ID=$(grep "test-project-db:" project-assignments.txt | cut -d' ' -f2)
```

## 🎯 Success Metrics

The consolidated results here will provide:
- Visual proof of 82 Mittwald tool operations
- Comprehensive error documentation
- Performance metrics across all APIs
- Final test coverage report