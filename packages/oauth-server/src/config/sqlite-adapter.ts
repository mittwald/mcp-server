/**
 * SQLite Adapter for oidc-provider
 *
 * This adapter stores OAuth sessions, tokens, and client data in SQLite
 * instead of Redis, providing better persistence and eliminating external dependencies.
 */

import { createRequire } from 'module';
import { logger } from '../services/logger.js';

type BetterSqlite3Module = typeof import('better-sqlite3');
type BetterSqlite3Instance = InstanceType<BetterSqlite3Module>;

let cachedSQLiteModule: BetterSqlite3Module | null = null;

function loadSQLiteModule(): BetterSqlite3Module {
  if (cachedSQLiteModule) {
    return cachedSQLiteModule;
  }

  try {
    const require = createRequire(import.meta.url);
    cachedSQLiteModule = require('better-sqlite3');
    return cachedSQLiteModule;
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to load better-sqlite3 module');
    throw new Error(
      'better-sqlite3 is required for the SQLite storage adapter. Install better-sqlite3 or switch STORAGE_ADAPTER=memory.',
    );
  }
}

export interface AdapterPayload {
  [key: string]: any;
}

export class SQLiteAdapter {
  private db: BetterSqlite3Instance;
  private model: string;

  constructor(model: string) {
    this.model = model;

    // Use the same volume as JWKS storage for consistency
    const dbPath = '/app/jwks/oauth-sessions.db';

    const Database = loadSQLiteModule();
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL'); // Better concurrency
    this.db.pragma('synchronous = NORMAL'); // Good balance of safety/performance
    this.db.pragma('cache_size = 10000'); // 10MB cache

    this.setupSchema();
    this.setupCleanupJob();

    logger.info({ model, dbPath }, 'SQLite adapter initialized');
  }

  private setupSchema(): void {
    // Create table for all oidc-provider data types
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oauth_data (
        id TEXT PRIMARY KEY,
        model TEXT NOT NULL,
        data TEXT NOT NULL,
        expires_at INTEGER,
        consumed_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_model ON oauth_data(model);
      CREATE INDEX IF NOT EXISTS idx_expires_at ON oauth_data(expires_at);
      CREATE INDEX IF NOT EXISTS idx_consumed_at ON oauth_data(consumed_at);
    `);
  }

  private setupCleanupJob(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const result = this.db.prepare(`
        DELETE FROM oauth_data
        WHERE expires_at IS NOT NULL AND expires_at < ?
      `).run(now);

      if (result.changes > 0) {
        logger.info({ deletedRows: result.changes }, 'Cleaned up expired OAuth data');
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const row = this.db.prepare(`
      SELECT data, expires_at, consumed_at
      FROM oauth_data
      WHERE id = ? AND model = ?
    `).get(id, this.model) as any;

    if (!row) {
      logger.debug({ id, model: this.model }, 'OAuth data not found');
      return undefined;
    }

    // Check if expired
    if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
      logger.debug({ id, model: this.model }, 'OAuth data expired');
      this.destroy(id); // Clean up expired data
      return undefined;
    }

    const data = JSON.parse(row.data);

    // Add consumed timestamp if it exists
    if (row.consumed_at) {
      data.consumed = row.consumed_at;
    }

    logger.debug({ id, model: this.model }, 'OAuth data retrieved');
    return data;
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    // For device_code model, search by userCode in data
    if (this.model === 'DeviceCode') {
      const row = this.db.prepare(`
        SELECT id, data, expires_at
        FROM oauth_data
        WHERE model = ? AND json_extract(data, '$.userCode') = ?
      `).get(this.model, userCode) as any;

      if (!row) return undefined;

      // Check if expired
      if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
        this.destroy(row.id);
        return undefined;
      }

      return JSON.parse(row.data);
    }

    return undefined;
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    // Search by uid in data
    const row = this.db.prepare(`
      SELECT id, data, expires_at
      FROM oauth_data
      WHERE model = ? AND json_extract(data, '$.uid') = ?
    `).get(this.model, uid) as any;

    if (!row) return undefined;

    // Check if expired
    if (row.expires_at && row.expires_at < Math.floor(Date.now() / 1000)) {
      this.destroy(row.id);
      return undefined;
    }

    return JSON.parse(row.data);
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = expiresIn ? now + expiresIn : null;

    // Remove consumed timestamp from payload for storage (we store it separately)
    const { consumed, ...dataToStore } = payload;
    const consumedAt = consumed ? (typeof consumed === 'number' ? consumed : now) : null;

    this.db.prepare(`
      INSERT OR REPLACE INTO oauth_data
      (id, model, data, expires_at, consumed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      this.model,
      JSON.stringify(dataToStore),
      expiresAt,
      consumedAt,
      now
    );

    logger.debug({
      id,
      model: this.model,
      expiresIn,
      consumed: !!consumed
    }, 'OAuth data stored');
  }

  async consume(id: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);

    const result = this.db.prepare(`
      UPDATE oauth_data
      SET consumed_at = ?, updated_at = ?
      WHERE id = ? AND model = ?
    `).run(now, now, id, this.model);

    if (result.changes > 0) {
      logger.debug({ id, model: this.model }, 'OAuth data consumed');
    }
  }

  async destroy(id: string): Promise<void> {
    const result = this.db.prepare(`
      DELETE FROM oauth_data
      WHERE id = ? AND model = ?
    `).run(id, this.model);

    if (result.changes > 0) {
      logger.debug({ id, model: this.model }, 'OAuth data destroyed');
    }
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const result = this.db.prepare(`
      DELETE FROM oauth_data
      WHERE model = ? AND json_extract(data, '$.grantId') = ?
    `).run(this.model, grantId);

    if (result.changes > 0) {
      logger.debug({ grantId, model: this.model, deletedRows: result.changes }, 'OAuth data revoked by grantId');
    }
  }

  // Cleanup method for graceful shutdown
  close(): void {
    this.db.close();
    logger.info({ model: this.model }, 'SQLite adapter closed');
  }
}

// Factory function for oidc-provider
export function createSQLiteAdapter(model: string) {
  return new SQLiteAdapter(model);
}
