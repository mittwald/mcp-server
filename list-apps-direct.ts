import { MCPTestClient } from './tests/utils/mcp-test-client';

async function listApps() {
  console.log('Checking apps in project p-m0gl8n...\n');
  
  const client = new MCPTestClient();
  await client.initialize();
  
  try {
    // First get the project UUID
    const listResponse = await client.callTool('mittwald_project_list', {});
    const projectData = JSON.parse(listResponse.result.content[0].text);
    
    if (projectData.status === 'success' && projectData.data) {
      const lines = projectData.data.trim().split('\n');
      if (lines.length > 1) {
        const projectLine = lines[1].split('\t');
        const projectUuid = projectLine[0];
        console.log(`Project UUID: ${projectUuid}\n`);
        
        // Now list apps
        const appResponse = await client.callTool('mittwald_app_list', {
          projectId: projectUuid
        });
        
        console.log('App list response:', JSON.stringify(appResponse, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

listApps();