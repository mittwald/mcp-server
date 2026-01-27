// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mermaid({
			theme: 'default',
			darkTheme: 'dark',
		}),
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
