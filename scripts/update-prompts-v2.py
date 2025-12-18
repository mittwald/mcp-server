#!/usr/bin/env python3
"""
Update eval prompts from v1.0.0 to v2.0.0 format.
Adds "CALL tool directly" language and updates metadata.
"""

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

def get_task_section_v2(tool_name: str, display_name: str) -> str:
    """Generate the v2.0.0 Task section with CALL tool directly emphasis."""
    return f"""## Task
Execute the `{tool_name}` tool and verify the result.

**IMPORTANT**: You must CALL the MCP tool directly. Do NOT write a script or automation to simulate the tool call.

### Steps:
1. Verify prerequisites are in place (or establish them if needed)
2. **CALL** `{tool_name}` using the MCP tool interface
3. Verify the operation succeeded by checking the response
4. Record the outcome in your self-assessment

### How to Execute:
Use the MCP tool directly:
- Claude Code: Tool will be available in your tool list
- Provide parameters as specified in the tool schema
- Observe the actual response from the production server

**DO NOT**:
- Write a TypeScript/JavaScript/Python script to call the tool
- Create automation that simulates the tool execution
- Use fetch/axios/HTTP clients to bypass the MCP interface

**DO**:
- Call the tool using your MCP tool interface
- Use actual parameters from the tool schema
- Observe real responses from the Mittwald API"""

def update_prompt_content(old_prompt: str, tool_name: str, display_name: str) -> str:
    """Update the prompt markdown to v2.0.0 format."""
    # Find and replace the Task section
    task_pattern = r'## Task\nExecute the `[^`]+` tool and verify the result\.\n\n### Steps:.*?(?=### Example Parameters:|## Success Indicators)'

    new_task_section = get_task_section_v2(tool_name, display_name)

    # Replace the old Task section with the new one
    updated = re.sub(task_pattern, new_task_section + '\n\n', old_prompt, flags=re.DOTALL)

    # If the pattern didn't match (older format), insert after "Ensure all prerequisites..."
    if updated == old_prompt:
        prereq_end = "Ensure all prerequisites are met before executing the target tool.\n\n"
        if prereq_end in updated:
            parts = updated.split(prereq_end, 1)
            # Remove the old task section up to Example Parameters or Success Indicators
            remaining = parts[1]
            # Find where to cut
            for marker in ["### Example Parameters:", "## Success Indicators"]:
                if marker in remaining:
                    cut_point = remaining.index(marker)
                    updated = parts[0] + prereq_end + new_task_section + '\n\n' + remaining[cut_point:]
                    break

    return updated

def update_prompt_file(file_path: Path) -> bool:
    """Update a single prompt file to v2.0.0 format."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Check if already v2.0.0
        if data.get('metadata', {}).get('eval_version') == '2.0.0':
            print(f"  ⏭️  {file_path.name} - already v2.0.0, skipping")
            return False

        # Extract tool information
        tool_name = data['input']['tool_name']
        display_name = data['input']['display_name']

        # Update prompt content
        old_prompt = data['input']['prompt']
        data['input']['prompt'] = update_prompt_content(old_prompt, tool_name, display_name)

        # Update metadata
        data['metadata']['eval_version'] = '2.0.0'
        data['metadata']['updated_at'] = datetime.utcnow().isoformat() + 'Z'

        # Write back
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"  ✅ {file_path.name} - updated to v2.0.0")
        return True

    except Exception as e:
        print(f"  ❌ {file_path.name} - ERROR: {e}")
        return False

def update_domain_prompts(domain_dir: Path) -> tuple[int, int]:
    """Update all prompts in a domain directory."""
    json_files = list(domain_dir.glob('*.json'))
    if not json_files:
        return 0, 0

    print(f"\n📁 {domain_dir.name}/")
    updated_count = 0
    for file_path in sorted(json_files):
        if update_prompt_file(file_path):
            updated_count += 1

    return updated_count, len(json_files)

def main():
    """Main execution."""
    base_dir = Path(__file__).parent.parent / 'evals' / 'prompts'

    if not base_dir.exists():
        print(f"❌ Directory not found: {base_dir}")
        return

    print("🔄 Updating eval prompts to v2.0.0 format\n")
    print("=" * 60)

    total_updated = 0
    total_files = 0

    # Get all domain directories (exclude _archived)
    domain_dirs = [d for d in base_dir.iterdir() if d.is_dir() and d.name != '_archived']

    for domain_dir in sorted(domain_dirs):
        updated, total = update_domain_prompts(domain_dir)
        total_updated += updated
        total_files += total

    print("\n" + "=" * 60)
    print(f"\n✨ Summary:")
    print(f"   Updated: {total_updated} files")
    print(f"   Total:   {total_files} files")
    print(f"   Skipped: {total_files - total_updated} files (already v2.0.0)")

if __name__ == '__main__':
    main()
