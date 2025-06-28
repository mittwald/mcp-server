import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export async function handleContributor() {
  return formatToolResponse(
    "success",
    "The contributor command is a parent command for mStudio marketplace contributor operations. Please use one of the subcommands to perform specific contributor actions."
  );
}