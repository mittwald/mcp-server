/**
 * Result of a validation comparison between CLI and library
 */
export interface ValidationResult {
    /** Name of the tool being validated */
    toolName: string;
    /** Whether outputs match (100% parity) */
    passed: boolean;
    /** CLI execution output */
    cliOutput: {
        stdout: string;
        stderr: string;
        exitCode: number;
        durationMs: number;
    };
    /** Library execution output */
    libraryOutput: {
        data: unknown;
        status: number;
        durationMs: number;
    };
    /** List of discrepancies found */
    discrepancies: Array<{
        field: string;
        cliValue: unknown;
        libraryValue: unknown;
        diff: string;
    }>;
}
/**
 * Options for validation
 */
export interface ValidationOptions {
    /** Tool name */
    toolName: string;
    /** CLI command to run */
    cliCommand: string;
    /** CLI args */
    cliArgs: string[];
    /** Library function to call */
    libraryFn: () => Promise<unknown>;
    /** Fields to ignore in comparison (e.g., timing fields) */
    ignoreFields?: string[];
}
//# sourceMappingURL=types.d.ts.map