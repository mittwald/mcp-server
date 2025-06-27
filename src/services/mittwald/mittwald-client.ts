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

  constructor(apiToken?: string) {
    const token = apiToken || CONFIG.MITTWALD_API_TOKEN;
    
    if (!token) {
      throw new Error('Mittwald API token is required');
    }
    
    this.client = MittwaldAPIV2Client.newWithToken(token);
  }

  /**
   * Get the raw API client instance
   */
  public get api(): MittwaldAPIV2Client {
    return this.client;
  }

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
export function getMittwaldClient(apiToken?: string): MittwaldClient {
  if (!clientInstance || apiToken) {
    clientInstance = new MittwaldClient(apiToken);
  }
  return clientInstance;
}