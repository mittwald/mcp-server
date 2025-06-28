#!/usr/bin/env python3

import re
import sys
import os

def convert_tool_file(file_path):
    """Convert a tool file from parameters format to inputSchema format"""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Check if this file uses the old parameters format
    if 'parameters: z.object' not in content:
        return False
    
    print(f"Converting: {file_path}")
    
    # Replace imports
    content = re.sub(r'import \{ z \} from "zod";', 'import type { Tool } from \'@modelcontextprotocol/sdk/types.js\';', content)
    
    # Replace export declaration
    content = re.sub(r'export const ([a-zA-Z_]+) = \{', r'export const \1: Tool = {', content)
    
    # Replace parameters with inputSchema
    content = re.sub(r'parameters: z\.object\(\{', 'inputSchema: {\n    type: "object",\n    properties: {', content)
    
    # Convert Zod types to JSON Schema
    # String types
    content = re.sub(r'(\w+): z\s*\.string\(\)\s*\.optional\(\)\s*\.describe\("([^"]+)"\)', r'\1: {\n        type: "string",\n        description: "\2"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.string\(\)\s*\.describe\("([^"]+)"\)', r'\1: {\n        type: "string",\n        description: "\2"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.string\(\)\s*\.optional\(\)', r'\1: {\n        type: "string"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.string\(\)', r'\1: {\n        type: "string"\n      }', content)
    
    # Boolean types
    content = re.sub(r'(\w+): z\s*\.boolean\(\)\s*\.optional\(\)\s*\.describe\("([^"]+)"\)', r'\1: {\n        type: "boolean",\n        description: "\2"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.boolean\(\)\s*\.describe\("([^"]+)"\)', r'\1: {\n        type: "boolean",\n        description: "\2"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.boolean\(\)\s*\.optional\(\)', r'\1: {\n        type: "boolean"\n      }', content)
    content = re.sub(r'(\w+): z\s*\.boolean\(\)', r'\1: {\n        type: "boolean"\n      }', content)
    
    # Handle enum types (simplified - may need manual adjustment)
    content = re.sub(r'\.enum\(\[(.*?)\]\)', r'enum: [\1]', content, flags=re.DOTALL)
    content = re.sub(r'\.default\("([^"]+)"\)', r'default: "\1"', content)
    
    # Close the schema
    content = re.sub(r'\s*\}\)\s*$', '\n    },\n    required: []\n  }\n};', content, flags=re.MULTILINE)
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(content)
    
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 convert-parameters-tool.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    if convert_tool_file(file_path):
        print(f"✅ Converted {file_path}")
    else:
        print(f"⚠️  No conversion needed for {file_path}")