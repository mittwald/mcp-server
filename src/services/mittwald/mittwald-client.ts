import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { CONFIG } from '../../server/config.js';

/**
 * Mittwald API client service
 * 
 * @remarks
 * This service provides a wrapper around the Mittwald API client
 * with authentication and common operations.
 */
export class MittwaldClient {
  private client: MittwaldAPIV2Client;

  constructor(apiToken: string) {
    if (!apiToken) {
      throw new Error('Mittwald access token is required');
    }
    this.client = MittwaldAPIV2Client.newWithToken(apiToken);
  }

  /**
   * Strongly-typed SDK surface.
   */
  public get api(): MittwaldAPIV2Client {
    return this.client;
  }

  /**
   * Alias for `api` to ease incremental migrations.
   */
  public get typedApi(): MittwaldAPIV2Client {
    return this.client;
  }

  // Direct namespace access for all SDK APIs
  public get app() { return this.client.app; }
  public get article() { return this.client.article; }
  public get backup() { return this.client.backup; }
  public get container() { return this.client.container; }
  public get contract() { return this.client.contract; }
  public get conversation() { return this.client.conversation; }
  public get cronjob() { return this.client.cronjob; }
  public get customer() { return this.client.customer; }
  public get database() { return this.client.database; }
  public get domain() { return this.client.domain; }
  public get file() { return this.client.file; }
  public get mail() { return this.client.mail; }
  public get marketplace() { return this.client.marketplace; }
  public get notification() { return this.client.notification; }
  public get project() { return this.client.project; }
  public get sshsftpUser() { return this.client.sshsftpUser; }
  public get user() { return this.client.user; }

  /**
   * Test the API connection by fetching the user's email
   * @returns true if connection is successful, false otherwise
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.user.getOwnEmail({});
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to Mittwald API:', error);
      return false;
    }
  }

  /**
   * Get authenticated user information
   * @returns User email if successful
   */
  public async getUserInfo(): Promise<{ email: string } | null> {
    try {
      const response = await this.client.user.getOwnEmail({});
      if (response.status === 200 && response.data) {
        return { email: response.data.email };
      }
      return null;
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }
}

// Export a singleton instance for convenience
let clientInstance: MittwaldClient | null = null;

/**
 * Get or create a singleton Mittwald client instance
 * @param apiToken Optional API token to override the default from config
 */
export function getMittwaldClient(apiToken: string): MittwaldClient {
  if (!clientInstance || apiToken) {
    clientInstance = new MittwaldClient(apiToken);
  }
  return clientInstance;
}
