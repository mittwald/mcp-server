// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Mittwald MCP',
			description: 'Setup guides and documentation for integrating Mittwald MCP with AI coding assistants',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mittwald/mcp' }],
			sidebar: [
				{
					label: 'Getting Started',
					autogenerate: { directory: 'getting-started' },
				},
				{
					label: 'Concepts',
					autogenerate: { directory: 'explainers' },
				},
			],
		}),
	],
});
