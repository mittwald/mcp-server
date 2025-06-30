import { MCPTestClient } from './tests/utils/mcp-test-client';

// Map of app UUIDs to app names (from previous knowledge)
const APP_UUID_MAP: Record<string, string> = {
  '0b97d59f-ee13-4f18-a1f6-53e1beaf2e70': 'Nextcloud',
  '91fa05e7-34f7-42e8-a8d3-a9c42abd5f8c': 'Matomo', 
  '352971cc-b96a-4a26-8651-b08d7c8a7357': 'TYPO3',
  'da3aa3ae-4b6b-4398-a4a8-ee8def827876': 'WordPress',
  '4916ce3e-cba4-4d2e-9798-a8764aa14cf3': 'Contao',
  '5aac2f76-1ddb-4f32-863d-0acc4618fb7d': 'Joomla',
  '8d404bff-6d75-4833-9eed-1b83b0552585': 'Joomla', // Alternative UUID
  '595ff9f9-cdaf-4c29-b3f1-18dd3bfc36f0': 'Shopware 5',
  'b41dc9f0-f6d7-4f7d-9db5-ff45a20a13a2': 'Shopware 6'
};

async function parseApps() {
  console.log('Analyzing apps in project p-u0ykyd...\n');
  
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
        
        // Now list apps
        const appResponse = await client.callTool('mittwald_app_list', {
          projectId: projectUuid
        });
        
        const appData = JSON.parse(appResponse.result.content[0].text);
        
        if (appData.status === 'success' && Array.isArray(appData.data)) {
          console.log(`Found ${appData.data.length} app installations:\n`);
          
          // Group by app type
          const appCounts: Record<string, number> = {};
          
          appData.data.forEach((app: any) => {
            const appName = APP_UUID_MAP[app.Name] || `Unknown (${app.Name})`;
            appCounts[appName] = (appCounts[appName] || 0) + 1;
            
            console.log(`- ${appName}`);
            console.log(`  ID: ${app.ID}`);
            console.log(`  Status: ${app.Status}`);
            console.log(`  Created: ${app.Created}`);
            console.log(`  Version: ${app.Version}`);
            console.log('');
          });
          
          console.log('\nSummary by app type:');
          Object.entries(appCounts).forEach(([name, count]) => {
            console.log(`  ${name}: ${count} installation(s)`);
          });
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

parseApps();