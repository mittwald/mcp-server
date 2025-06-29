#!/bin/bash
# Fix formatToolResponse calls to use correct signature

FILE=$1

if [ -z "$FILE" ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

# Replace formatToolResponse({ success: true, data: ... }) with formatToolResponse('success', 'message', data)
sed -i '' 's/formatToolResponse({[[:space:]]*success:[[:space:]]*true,[[:space:]]*data:[[:space:]]*\(.*\)[[:space:]]*})/formatToolResponse("success", "Operation successful", \1)/g' "$FILE"

# Replace formatToolResponse({ success: false, error: ... }) with formatToolResponse('error', error)
sed -i '' 's/formatToolResponse({[[:space:]]*success:[[:space:]]*false,[[:space:]]*error:[[:space:]]*\(.*\)[[:space:]]*})/formatToolResponse("error", \1)/g' "$FILE"

echo "Fixed formatToolResponse calls in $FILE"