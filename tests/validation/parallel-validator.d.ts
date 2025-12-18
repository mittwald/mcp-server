import { ValidationResult, ValidationOptions } from './types.js';
/**
 * Validate tool parity between CLI and library implementations
 */
export declare function validateToolParity(options: ValidationOptions): Promise<ValidationResult>;
/**
 * Generate human-readable validation report
 */
export declare function generateReport(results: ValidationResult[]): string;
//# sourceMappingURL=parallel-validator.d.ts.map