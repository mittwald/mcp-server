import { createHelpTool } from '../../../../utils/help-tool-factory.js';
import { MARKDOWN_REGISTRY } from '../../../../utils/markdown-loader.js';

// Find the virtualhost-help metadata
const virtualhostMetadata = MARKDOWN_REGISTRY.find(m => m.filename === 'virtualhost-help.md')!;

// Create the help tool using the factory
const { handler, definition } = createHelpTool(
  virtualhostMetadata,
  'mittwald_domain_virtualhost_help',
  [
    "mittwald_domain_virtualhost_create",
    "mittwald_domain_virtualhost_list",
    "mittwald_domain_virtualhost_get",
    "mittwald_domain_virtualhost_delete",
    "mittwald_domain_virtualhost_help"
  ]
);

export const handleVirtualHostHelp = handler;
export const virtualHostHelpDefinition = definition;