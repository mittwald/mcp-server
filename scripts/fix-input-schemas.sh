#!/bin/bash

# Convert tools using 'parameters' to proper 'inputSchema' format
# Usage: ./scripts/fix-input-schemas.sh

set -e

echo "🔧 Converting tools from 'parameters' to 'inputSchema' format..."

# Find all TypeScript files with 'parameters: z.object'
find src/constants/tool/mittwald-cli -name "*.ts" -type f | while read -r file; do
    if grep -q "parameters: z\.object" "$file"; then
        echo "  📝 Converting: $file"
        
        # Create a temporary file for the conversion
        tmp_file=$(mktemp)
        
        # Read the file and convert parameters to inputSchema
        awk '
        BEGIN { in_tool_object = 0; in_parameters = 0; has_parameters = 0 }
        
        # Detect start of tool object export
        /^export const [a-zA-Z_]+ = \{/ { 
            in_tool_object = 1 
            print $0
            next
        }
        
        # If we are in tool object and see parameters
        in_tool_object && /parameters: z\.object\(/ {
            has_parameters = 1
            in_parameters = 1
            # Replace parameters with inputSchema and convert to JSON Schema format
            print "  inputSchema: {"
            print "    type: \"object\","
            print "    properties: {"
            next
        }
        
        # Handle the closing of parameters
        in_parameters && /^\s*\}\)\s*$/ {
            print "    },"
            print "    required: []"
            print "  },"
            in_parameters = 0
            next
        }
        
        # Convert Zod schema lines to JSON Schema
        in_parameters && /\.string\(\)/ {
            gsub(/z\.string\(\)/, "{ \"type\": \"string\" }")
            gsub(/\.optional\(\)/, "")
            gsub(/\.describe\("([^"]*)"/, ", \"description\": \"\\1\"")
            print $0
            next
        }
        
        in_parameters && /\.boolean\(\)/ {
            gsub(/z\.boolean\(\)/, "{ \"type\": \"boolean\" }")
            gsub(/\.optional\(\)/, "")
            gsub(/\.describe\("([^"]*)"/, ", \"description\": \"\\1\"")
            print $0
            next
        }
        
        # Handle enum types
        in_parameters && /\.enum\(\[/ {
            gsub(/z\.enum\(\[/, "{ \"type\": \"string\", \"enum\": [")
            gsub(/\]\)/, "] }")
            gsub(/\.optional\(\)/, "")
            gsub(/\.default\("([^"]*)"\)/, ", \"default\": \"\\1\"")
            gsub(/\.describe\("([^"]*)"/, ", \"description\": \"\\1\"")
            print $0
            next
        }
        
        # End of tool object
        in_tool_object && /^\};\s*$/ {
            in_tool_object = 0
            print $0
            next
        }
        
        # Print all other lines as-is
        { print $0 }
        ' "$file" > "$tmp_file"
        
        # Replace original file if conversion was successful
        if [ -s "$tmp_file" ]; then
            mv "$tmp_file" "$file"
            echo "    ✅ Converted successfully"
        else
            rm "$tmp_file"
            echo "    ❌ Conversion failed"
        fi
    fi
done

echo "✅ Completed converting parameters to inputSchema format"