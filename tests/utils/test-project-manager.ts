/**
 * Test utilities for managing projects and app installations
 */

import { MCPTestClient } from './mcp-test-client';
import { parseToolContent } from './test-helpers';
import { pollOperation, createProgressReporter, sleep } from './async-operations';
import { logger } from '../../src/utils/logger';

export interface TestProject {
  projectId: string;
  shortId: string;
  serverId: string;
  description: string;
}

export interface TestAppInstallation {
  appType: string;
  installationId: string;
  projectId: string;
  version: string;
  host?: string;
  status: 'installing' | 'completed' | 'failed';
  error?: string;
}

export class TestProjectManager {
  private client: MCPTestClient;
  private createdProjects: TestProject[] = [];
  private installedApps: TestAppInstallation[] = [];

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  /**
   * Create a test project and wait for it to be ready
   */
  async createTestProject(description: string): Promise<TestProject> {
    logger.info(`Creating test project: ${description}`);
    
    // First, get a server to create the project on
    const serversResponse = await this.client.callTool('mittwald_server_list', {
      output: 'json'
    });
    const serversContent = parseToolContent(serversResponse.result);
    
    if (serversContent.status !== 'success' || !serversContent.data?.length) {
      throw new Error('No servers available');
    }
    
    const serverId = serversContent.data[0].id;
    
    // Create the project
    const createResponse = await this.client.callTool('mittwald_project_create', {
      description,
      serverId,
      wait: false // We'll poll manually for better control
    });
    
    const createContent = parseToolContent(createResponse.result);
    if (createContent.status !== 'success') {
      throw new Error(`Failed to create project: ${createContent.message}`);
    }
    
    // The API returns projectId, not id
    const projectId = createContent.data?.projectId || createContent.data?.id;
    if (!projectId) {
      throw new Error(`Invalid project creation response: ${JSON.stringify(createContent.data)}`);
    }
    
    // We'll get the shortId from the project details later
    let shortId = projectId; // Use full ID initially
    
    // Wait a bit for project to be created in the system
    logger.info(`Waiting for project ${projectId} to initialize...`);
    await sleep(10000); // 10 seconds initial wait
    
    // Poll for project to be ready
    const progressReporter = createProgressReporter(`Project creation`);
    
    // Try to get project list to find our project
    const result = await pollOperation(
      async () => {
        try {
          // Try listing projects to find ours
          const listResponse = await this.client.callTool('mittwald_project_list', {
            output: 'json'
          });
          
          const listContent = parseToolContent(listResponse.result);
          if (listContent.status === 'success' && listContent.data) {
            // Find our project in the list
            const ourProject = listContent.data.find(
              (p: any) => p.id === projectId
            );
            
            if (ourProject) {
              // Update shortId if we found it
              if (ourProject.shortId) {
                shortId = ourProject.shortId;
                logger.info(`Found project ${shortId} in list`);
              }
              
              // Check if ready
              if (ourProject.isReady || ourProject.readiness === 'ready') {
                logger.info(`Project ${shortId} is ready!`);
                return { completed: true, data: ourProject };
              } else {
                logger.debug(`Project ${shortId} status: ${ourProject.readiness || 'creating'}`);
              }
            }
          }
          
          return { completed: false };
        } catch (error) {
          // During creation, some errors are expected
          logger.debug(`Polling error:`, error);
          return { completed: false };
        }
      },
      {
        maxAttempts: 90, // 7.5 minutes with 5s intervals
        intervalMs: 5000,
        timeoutMs: 450000, // 7.5 minutes
        onProgress: progressReporter
      }
    );
    
    if (!result.success) {
      throw new Error(`Project creation timed out or failed: ${result.error}`);
    }
    
    const project: TestProject = {
      projectId,
      shortId,
      serverId,
      description
    };
    
    this.createdProjects.push(project);
    logger.info(`Project ${shortId} created successfully in ${result.duration}ms`);
    
    return project;
  }

  /**
   * Install an app in a project
   */
  async installApp(
    projectId: string,
    appType: string,
    options: {
      version?: string;
      adminUser?: string;
      adminEmail?: string;
      adminPass?: string;
      siteTitle?: string;
    } = {}
  ): Promise<TestAppInstallation> {
    logger.info(`Installing ${appType} in project ${projectId}`);
    
    // Try to get project ingresses for hostname
    let host: string | undefined;
    try {
      const ingressResponse = await this.client.callTool('mittwald_domain_virtualhost_list', {
        projectId: projectId,
        output: 'json'
      });
      
      const ingressContent = parseToolContent(ingressResponse.result);
      if (ingressContent.status === 'success' && ingressContent.data?.virtualhosts?.length > 0) {
        host = ingressContent.data.virtualhosts[0].hostname;
      }
    } catch (error) {
      logger.warn(`Could not get hostname for project ${projectId}:`, error);
      // Continue without hostname - installation might still work
    }
    
    // Install the app using the generic installer
    const installResponse = await this.client.callTool('mittwald_app_install', {
      app_type: appType,
      project_id: projectId,
      version: options.version, // Don't default to 'latest' - let the handler choose
      host,
      admin_user: options.adminUser || `admin_${appType}`,
      admin_email: options.adminEmail || `admin@${appType}.test`,
      admin_pass: options.adminPass || this.generateSecurePassword(),
      site_title: options.siteTitle || `Test ${appType} Site`,
      wait: false // We'll poll manually
    });
    
    const installContent = parseToolContent(installResponse.result);
    if (installContent.status !== 'success') {
      throw new Error(`Failed to start ${appType} installation: ${installContent.message}`);
    }
    
    const installationId = installContent.data.appInstallationId;
    
    const installation: TestAppInstallation = {
      appType,
      installationId,
      projectId,
      version: options.version || 'latest',
      host,
      status: 'installing'
    };
    
    this.installedApps.push(installation);
    return installation;
  }

  /**
   * Wait for an app installation to complete
   */
  async waitForAppInstallation(
    installation: TestAppInstallation,
    timeoutMs: number = 600000 // 10 minutes
  ): Promise<void> {
    logger.info(`Waiting for ${installation.appType} installation to complete`);
    
    const progressReporter = createProgressReporter(`${installation.appType} installation`);
    
    const result = await pollOperation(
      async () => {
        const getResponse = await this.client.callTool('mittwald_app_get', {
          installationId: installation.installationId,
          output: 'json'
        });
        
        const getContent = parseToolContent(getResponse.result);
        
        if (getContent.status === 'success') {
          const appData = getContent.data;
          if (appData.installationPath) {
            // Installation complete
            installation.status = 'completed';
            return { completed: true, data: appData };
          }
        } else if (getContent.message?.includes('not found')) {
          // Installation might have failed
          installation.status = 'failed';
          installation.error = 'Installation not found';
          return { completed: true, error: 'Installation not found' };
        }
        
        return { completed: false };
      },
      {
        maxAttempts: Math.floor(timeoutMs / 5000),
        intervalMs: 5000,
        timeoutMs,
        onProgress: progressReporter
      }
    );
    
    if (!result.success) {
      installation.status = 'failed';
      installation.error = result.error;
      throw new Error(`${installation.appType} installation failed: ${result.error}`);
    }
    
    logger.info(`${installation.appType} installation completed in ${result.duration}ms`);
  }

  /**
   * Install multiple apps in parallel
   */
  async installAppsInParallel(
    projectId: string,
    appTypes: string[],
    options: Record<string, any> = {}
  ): Promise<TestAppInstallation[]> {
    logger.info(`Installing ${appTypes.length} apps in parallel`);
    
    // Start all installations
    const installations = await Promise.all(
      appTypes.map(appType => 
        this.installApp(projectId, appType, options[appType] || {})
      )
    );
    
    // Wait a bit for installations to start
    await sleep(5000);
    
    // Wait for all installations to complete in parallel
    await Promise.all(
      installations.map(installation => 
        this.waitForAppInstallation(installation).catch(error => {
          logger.error(`Failed to install ${installation.appType}:`, error);
          installation.status = 'failed';
          installation.error = error.message;
        })
      )
    );
    
    return installations;
  }

  /**
   * Uninstall an app
   */
  async uninstallApp(installationId: string): Promise<void> {
    logger.info(`Uninstalling app ${installationId}`);
    
    const response = await this.client.callTool('mittwald_app_uninstall', {
      installationId: installationId,
      force: true,
      quiet: true
    });
    
    const content = parseToolContent(response.result);
    if (content.status !== 'success') {
      logger.warn(`Failed to uninstall app ${installationId}: ${content.message}`);
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    logger.info(`Deleting project ${projectId}`);
    
    const response = await this.client.callTool('mittwald_project_delete', {
      projectId,
      force: true
    });
    
    const content = parseToolContent(response.result);
    if (content.status !== 'success') {
      logger.warn(`Failed to delete project ${projectId}: ${content.message}`);
    }
  }

  /**
   * Clean up all created resources
   */
  async cleanup(): Promise<void> {
    logger.info('Cleaning up test resources');
    
    // Uninstall all apps
    for (const app of this.installedApps) {
      if (app.installationId) {
        try {
          await this.uninstallApp(app.installationId);
        } catch (error) {
          logger.error(`Failed to uninstall ${app.appType}:`, error);
        }
      }
    }
    
    // Wait a bit for uninstalls to process
    await sleep(5000);
    
    // Delete all projects
    for (const project of this.createdProjects) {
      try {
        await this.deleteProject(project.projectId);
      } catch (error) {
        logger.error(`Failed to delete project ${project.shortId}:`, error);
      }
    }
    
    this.installedApps = [];
    this.createdProjects = [];
  }

  /**
   * Generate a secure password
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get summary of test resources
   */
  getSummary(): { projects: TestProject[]; apps: TestAppInstallation[] } {
    return {
      projects: [...this.createdProjects],
      apps: [...this.installedApps]
    };
  }
}