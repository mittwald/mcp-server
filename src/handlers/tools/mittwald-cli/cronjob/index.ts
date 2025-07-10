// Export CLI handlers with aliases to replace the old API handlers
export { handleCronjobCreateCli as handleCronjobCreate } from './create-cli.js';
export { handleCronjobDeleteCli as handleCronjobDelete } from './delete-cli.js';
export { handleCronjobExecuteCli as handleCronjobExecute } from './execute-cli.js';
export { handleCronjobGetCli as handleMittwaldCronjobGet } from './get-cli.js';
export { handleCronjobListCli as handleMittwaldCronjobList } from './list-cli.js';
export { handleCronjobUpdateCli as handleMittwaldCronjobUpdate } from './update-cli.js';
export { handleMittwaldCronjob } from './cronjob.js';

// Export CLI execution handlers with aliases
export { handleCronjobExecutionAbortCli as handleCronjobExecutionAbort } from './execution-abort-cli.js';
export { handleCronjobExecutionGetCli as handleCronjobExecutionGet } from './execution-get-cli.js';
export { handleCronjobExecutionListCli as handleCronjobExecutionList } from './execution-list-cli.js';
export { handleCronjobExecutionLogsCli as handleCronjobExecutionLogs } from './execution-logs-cli.js';
export { handleCronjobExecution } from './execution.js';