/**
 * Tool validation record schema.
 * Tracks validation status for each of 115 MCP tools.
 */

export interface ToolValidationRecord {
  // Identification
  tool_name: string;
  tool_domain: string;

  // Validation status
  status: 'not_tested' | 'success' | 'failed';

  // Success path (if status === 'success')
  validated_by_scenario?: string;
  validated_at?: string;
  last_success_run?: string;

  // Failure path (if status === 'failed')
  failure_details?: {
    error_message: string;
    error_code?: string;
    failed_in_scenario: string;
    failed_at: string;
    failure_pattern_id?: string;
  };

  // Coverage metadata
  tested_in_scenarios: string[];
  total_calls: number;
}

/**
 * Tool validation database (all 115 tools).
 */
export interface ToolValidationDatabase {
  version: string;
  generated_at: string;
  tools: ToolValidationRecord[];
}
