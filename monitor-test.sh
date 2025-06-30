#!/bin/bash
# Monitor the test progress

echo "Monitoring test progress..."
echo "Press Ctrl+C to stop monitoring"

while true; do
    clear
    echo "=== Test Progress Monitor ==="
    echo "Time: $(date)"
    echo ""
    
    # Show last 30 lines of meaningful output
    grep -E "(Step|Installing|version|✅|❌|Failed|Success|Fetching|Lifecycle|apps)" new-test-run.log | tail -30
    
    # Check if test is complete
    if grep -q "Test Files.*passed\|failed" new-test-run.log; then
        echo ""
        echo "=== TEST COMPLETE ==="
        grep -A10 "Test Files" new-test-run.log
        break
    fi
    
    sleep 5
done