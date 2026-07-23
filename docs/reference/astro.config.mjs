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
			description: 'API Reference for Mittwald MCP Server - 116 tools for managing Mittwald hosting infrastructure',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mittwald/mcp-server' }],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Overview', slug: 'tools' },
					],
				},
				{
					label: 'Tools by Domain',
					items: [
						{ label: 'App', autogenerate: { directory: 'tools/app' }, collapsed: true },
						{ label: 'Backup', autogenerate: { directory: 'tools/backup' }, collapsed: true },
						{ label: 'Certificate', autogenerate: { directory: 'tools/certificate' }, collapsed: true },
						{ label: 'Container', autogenerate: { directory: 'tools/container' }, collapsed: true },
						{ label: 'Cronjob', autogenerate: { directory: 'tools/cronjob' }, collapsed: true },
						{ label: 'Database', autogenerate: { directory: 'tools/database' }, collapsed: true },
						{ label: 'Domain', autogenerate: { directory: 'tools/domain' }, collapsed: true },
						{ label: 'Mail', autogenerate: { directory: 'tools/mail' }, collapsed: true },
						{ label: 'Organization', autogenerate: { directory: 'tools/org' }, collapsed: true },
						{ label: 'Project', autogenerate: { directory: 'tools/project' }, collapsed: true },
						{ label: 'Registry', autogenerate: { directory: 'tools/registry' }, collapsed: true },
						{ label: 'Server', autogenerate: { directory: 'tools/server' }, collapsed: true },
						{ label: 'SSH', autogenerate: { directory: 'tools/ssh' }, collapsed: true },
						{ label: 'Stack', autogenerate: { directory: 'tools/stack' }, collapsed: true },
						{ label: 'User', autogenerate: { directory: 'tools/user' }, collapsed: true },
						{ label: 'Volume', autogenerate: { directory: 'tools/volume' }, collapsed: true },
					],
				},
			],
		}),
	],
});
