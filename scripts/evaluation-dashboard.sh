#!/bin/bash
# Evaluation dashboard for Swarm V2 progress tracking

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Swarm V2 Evaluation Dashboard ===${NC}"
echo ""

# Count current tools
TOTAL_TOOLS=$(grep -c "mittwald_" src/constants/tools.ts || echo "0")
HANDLER_FILES=$(find src/handlers/tools/mittwald-cli -name "*.js" 2>/dev/null | wc -l || echo "0")
DEFINITION_FILES=$(find src/constants/tool/mittwald-cli -name "*.js" 2>/dev/null | wc -l || echo "0")

echo -e "${BLUE}📊 Tool Implementation Status:${NC}"
echo "   Total tools in registry: $TOTAL_TOOLS"
echo "   Handler files: $HANDLER_FILES"
echo "   Definition files: $DEFINITION_FILES"
echo ""

# Calculate completion percentage
if [ "$TOTAL_TOOLS" -gt 0 ]; then
    COMPLETION=$((HANDLER_FILES * 100 / 169))
    echo -e "${GREEN}   Overall completion: $COMPLETION% ($HANDLER_FILES/169 tools)${NC}"
else
    echo -e "${RED}   No tools found in registry${NC}"
fi
echo ""

# Check for issues file
if [ -f "evaluation-issues.csv" ]; then
    echo -e "${BLUE}🐛 Issues by Severity:${NC}"
    
    CRITICAL=$(grep ",critical," evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    HIGH=$(grep ",high," evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    MEDIUM=$(grep ",medium," evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    LOW=$(grep ",low," evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    
    if [ "$CRITICAL" -gt 0 ]; then
        echo -e "   ${RED}Critical: $CRITICAL${NC}"
    else
        echo -e "   ${GREEN}Critical: $CRITICAL${NC}"
    fi
    
    if [ "$HIGH" -gt 0 ]; then
        echo -e "   ${YELLOW}High: $HIGH${NC}"
    else
        echo -e "   ${GREEN}High: $HIGH${NC}"
    fi
    
    echo "   Medium: $MEDIUM"
    echo "   Low: $LOW"
    echo ""
    
    echo -e "${BLUE}🤖 Issues by Agent:${NC}"
    for i in {1..20}; do
        count=$(grep "^.*,agent-$i," evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "   Agent $i: $count issues"
        fi
    done
    echo ""
else
    echo -e "${YELLOW}⚠️  No evaluation-issues.csv found. Run 'npm run validate-tools' first.${NC}"
    echo ""
fi

# Show agent progress from swarm directories
if [ -d "/Users/robert/Code/Mittwald/mittwald-cli-swarm-v2" ]; then
    echo -e "${BLUE}📈 Agent Progress:${NC}"
    for i in {1..20}; do
        if [ -f "/Users/robert/Code/Mittwald/mittwald-cli-swarm-v2/agent-$i/progress.log" ]; then
            lines=$(wc -l < "/Users/robert/Code/Mittwald/mittwald-cli-swarm-v2/agent-$i/progress.log" 2>/dev/null || echo "0")
            if [ "$lines" -gt 0 ]; then
                echo "   Agent $i: $lines progress entries"
            fi
        fi
    done
    echo ""
fi

# Check TypeScript compilation
echo -e "${BLUE}🔧 Build Status:${NC}"
if npm run typecheck --silent >/dev/null 2>&1; then
    echo -e "   ${GREEN}TypeScript: ✅ No errors${NC}"
else
    echo -e "   ${RED}TypeScript: ❌ Has errors${NC}"
fi

if npm run lint --silent >/dev/null 2>&1; then
    echo -e "   ${GREEN}Linting: ✅ No issues${NC}"
else
    echo -e "   ${YELLOW}Linting: ⚠️  Has warnings${NC}"
fi
echo ""

# Show recent activity
echo -e "${BLUE}📝 Recent Activity:${NC}"
if [ -f "evaluation-issues.csv" ]; then
    TOTAL_ISSUES=$(tail -n +2 evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    OPEN_ISSUES=$(grep ",open$" evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    FIXED_ISSUES=$(grep ",fixed$" evaluation-issues.csv 2>/dev/null | wc -l || echo "0")
    
    echo "   Total issues logged: $TOTAL_ISSUES"
    echo "   Open issues: $OPEN_ISSUES"
    echo "   Fixed issues: $FIXED_ISSUES"
    
    if [ "$TOTAL_ISSUES" -gt 0 ]; then
        PROGRESS=$((FIXED_ISSUES * 100 / TOTAL_ISSUES))
        echo "   Resolution progress: $PROGRESS%"
    fi
else
    echo "   No issue tracking data available"
fi
echo ""

# Merge readiness assessment
echo -e "${BLUE}🚀 Merge Readiness:${NC}"

READY=true

if [ "$CRITICAL" -gt 0 ]; then
    echo -e "   ${RED}❌ Critical issues must be resolved${NC}"
    READY=false
fi

if [ "$HIGH" -gt 5 ]; then
    echo -e "   ${YELLOW}⚠️  Many high-priority issues remaining${NC}"
fi

if [ "$COMPLETION" -lt 95 ]; then
    echo -e "   ${YELLOW}⚠️  Tool implementation not complete${NC}"
    READY=false
fi

if [ "$READY" = true ]; then
    echo -e "   ${GREEN}✅ Ready for merge!${NC}"
else
    echo -e "   ${YELLOW}⏳ Not ready - resolve issues first${NC}"
fi

echo ""
echo -e "${BLUE}📋 Quick Actions:${NC}"
echo "   npm run validate-tools    - Run full validation"
echo "   npm run typecheck         - Check TypeScript"
echo "   npm run lint              - Check code style" 
echo "   npm run test              - Run tests"
echo ""