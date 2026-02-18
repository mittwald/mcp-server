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
			customCss: ['./src/styles/mittwald-theme.css'],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mittwald/mcp' }],
			sidebar: [
				{
					label: 'Getting Connected',
					autogenerate: { directory: 'getting-connected' },
				},
				{
					label: 'Tutorials',
					autogenerate: { directory: 'tutorials' },
				},
				{
					label: 'How-To',
					autogenerate: { directory: 'how-to' },
				},
				{
					label: 'Runbooks',
					autogenerate: { directory: 'runbooks' },
				},
				{
					label: 'Auth & Token Lifecycle',
					autogenerate: { directory: 'auth-token-lifecycle' },
				},
				{
					label: 'Explainers',
					autogenerate: { directory: 'explainers' },
				},
			],
		}),
	],
});
