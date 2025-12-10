#!/usr/bin/env tsx

import { MittwaldAPIV2Client } from '@mittwald/api-client';

async function getContainerResources() {
  // Get API token from environment
  const apiToken = process.env.MITTWALD_API_TOKEN;

  if (!apiToken) {
    console.error('Error: MITTWALD_API_TOKEN environment variable is required');
    process.exit(1);
  }

  // Create client
  const client = MittwaldAPIV2Client.newWithToken(apiToken);

  try {
    console.log('='.repeat(80));
    console.log('CONTAINER RESOURCE ALLOCATION AND USAGE REPORT');
    console.log('='.repeat(80));
    console.log('');

    // Step 1: List all projects
    console.log('Fetching projects...\n');
    const projectsResponse = await client.project.listProjects({});

    if (projectsResponse.status !== 200) {
      console.error('Failed to fetch projects:', projectsResponse.status);
      process.exit(1);
    }

    const projects = projectsResponse.data || [];
    console.log(`Found ${projects.length} project(s)\n`);

    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }

    // Step 2: For each project, get containers and their resources
    for (const project of projects) {
      console.log('='.repeat(80));
      console.log(`PROJECT: ${project.description || project.id}`);
      console.log(`ID: ${project.id}`);
      console.log('='.repeat(80));
      console.log('');

      // Get detailed project info
      const projectDetails = await client.project.getProject({
        projectId: project.id,
      });

      if (projectDetails.status === 200 && projectDetails.data) {
        const details = projectDetails.data;
        console.log('Project Details:');
        console.log(`  Status: ${details.isReady ? 'Ready' : 'Not Ready'}`);
        if (details.createdAt) {
          console.log(`  Created: ${new Date(details.createdAt).toISOString()}`);
        }
        console.log('');
      }

      // List containers for this project
      try {
        const containersResponse = await client.container.listContainers({
          projectId: project.id,
        });

        if (containersResponse.status !== 200) {
          console.log(`  Unable to fetch containers for this project\n`);
          continue;
        }

        const containers = containersResponse.data || [];
        console.log(`Found ${containers.length} container(s) in this project\n`);

        if (containers.length === 0) {
          console.log('  No containers in this project\n');
          continue;
        }

        // Display each container's resources
        for (let i = 0; i < containers.length; i++) {
          const container = containers[i];
          console.log('-'.repeat(80));
          console.log(`Container #${i + 1}: ${container.id}`);
          console.log('-'.repeat(80));

          // Basic container info
          console.log(`  Status: ${container.status || 'unknown'}`);
          console.log(`  Image: ${container.image || 'N/A'}`);

          // Resource allocation
          if (container.resources) {
            console.log('\n  Resource Allocation:');

            if (container.resources.memory) {
              console.log(`    Memory: ${container.resources.memory}`);
            }

            if (container.resources.cpu) {
              console.log(`    CPU: ${container.resources.cpu}`);
            }

            if (container.resources.disk) {
              console.log(`    Disk: ${container.resources.disk}`);
            }
          } else {
            console.log('  No resource allocation data available');
          }

          // Container metadata
          if (container.metadata) {
            console.log('\n  Metadata:');
            Object.entries(container.metadata).forEach(([key, value]) => {
              console.log(`    ${key}: ${value}`);
            });
          }

          // Ports
          if (container.ports && container.ports.length > 0) {
            console.log('\n  Exposed Ports:');
            container.ports.forEach(port => {
              console.log(`    - ${port}`);
            });
          }

          // Environment
          if (container.environment && Object.keys(container.environment).length > 0) {
            console.log('\n  Environment Variables:');
            Object.entries(container.environment).forEach(([key, value]) => {
              // Redact sensitive values
              const displayValue = key.toLowerCase().includes('secret') ||
                                 key.toLowerCase().includes('password') ||
                                 key.toLowerCase().includes('token')
                ? '***REDACTED***'
                : value;
              console.log(`    ${key}: ${displayValue}`);
            });
          }

          console.log('');
        }

      } catch (error) {
        console.log(`  Error fetching containers: ${error}\n`);
      }

      console.log('');
    }

    console.log('='.repeat(80));
    console.log('END OF REPORT');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('Error fetching container resources:', error);
    process.exit(1);
  }
}

getContainerResources();
