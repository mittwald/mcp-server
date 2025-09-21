/**
 * Client Secret Management for Confidential OAuth Clients
 *
 * Handles generation, storage, and validation of client secrets
 * for confidential clients (like Claude.ai) using client_secret_post authentication.
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { logger } from './logger.js';

export interface ClientSecret {
  clientId: string;
  clientSecret: string;
  createdAt: number;
  lastUsed?: number;
}

export class ClientSecretStore {
  private db: Database.Database;

  constructor() {
    // Use the same database as OAuth sessions
    const dbPath = '/app/jwks/oauth-sessions.db';
    this.db = new Database(dbPath);
    this.setupSchema();
    logger.info({ dbPath }, 'Client secret store initialized');
  }

  private setupSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS client_secrets (
        client_id TEXT PRIMARY KEY,
        client_secret TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        last_used INTEGER,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_client_secret ON client_secrets(client_secret);
      CREATE INDEX IF NOT EXISTS idx_last_used ON client_secrets(last_used);
    `);
  }

  /**
   * Generate a new client secret for a confidential client
   */
  generateClientSecret(clientId: string): string {
    const clientSecret = `cs_${nanoid(48)}`; // 48 chars for security
    const now = Math.floor(Date.now() / 1000);

    this.db.prepare(`
      INSERT OR REPLACE INTO client_secrets
      (client_id, client_secret, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(clientId, clientSecret, now, now);

    logger.info({ clientId }, 'Generated client secret for confidential client');
    return clientSecret;
  }

  /**
   * Validate a client secret during token exchange
   */
  validateClientSecret(clientId: string, providedSecret: string): boolean {
    const row = this.db.prepare(`
      SELECT client_secret, created_at
      FROM client_secrets
      WHERE client_id = ?
    `).get(clientId) as any;

    if (!row) {
      logger.warn({ clientId }, 'Client secret not found');
      return false;
    }

    const isValid = row.client_secret === providedSecret;

    if (isValid) {
      // Update last used timestamp
      const now = Math.floor(Date.now() / 1000);
      this.db.prepare(`
        UPDATE client_secrets
        SET last_used = ?, updated_at = ?
        WHERE client_id = ?
      `).run(now, now, clientId);

      logger.info({ clientId }, 'Client secret validated successfully');
    } else {
      logger.warn({ clientId }, 'Invalid client secret provided');
    }

    return isValid;
  }

  /**
   * Get client authentication method (used by oidc-provider)
   */
  getClientAuthMethod(clientId: string): 'none' | 'client_secret_post' | null {
    const row = this.db.prepare(`
      SELECT client_id FROM client_secrets WHERE client_id = ?
    `).get(clientId);

    // If client has a secret stored, it's confidential
    return row ? 'client_secret_post' : 'none';
  }

  /**
   * Remove client secret (for client deletion)
   */
  removeClientSecret(clientId: string): boolean {
    const result = this.db.prepare(`
      DELETE FROM client_secrets WHERE client_id = ?
    `).run(clientId);

    if (result.changes > 0) {
      logger.info({ clientId }, 'Client secret removed');
      return true;
    }

    return false;
  }

  /**
   * Cleanup old unused secrets (for maintenance)
   */
  cleanupOldSecrets(olderThanDays: number = 90): number {
    const cutoff = Math.floor((Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)) / 1000);

    const result = this.db.prepare(`
      DELETE FROM client_secrets
      WHERE (last_used IS NULL AND created_at < ?)
         OR (last_used IS NOT NULL AND last_used < ?)
    `).run(cutoff, cutoff);

    if (result.changes > 0) {
      logger.info({ deletedSecrets: result.changes, olderThanDays }, 'Cleaned up old client secrets');
    }

    return result.changes;
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
    logger.info('Client secret store closed');
  }
}

// Singleton instance
let clientSecretStore: ClientSecretStore | null = null;

export function getClientSecretStore(): ClientSecretStore {
  if (!clientSecretStore) {
    clientSecretStore = new ClientSecretStore();
  }
  return clientSecretStore;
}