/**
 * Storage Adapters for oidc-provider
 *
 * Supports SQLite (recommended) and Memory storage.
 * Redis support removed in favor of SQLite for better persistence.
 */

import type { Adapter, AdapterPayload } from 'oidc-provider';
import { logger } from '../services/logger.js';
import { createSQLiteAdapter } from './sqlite-adapter.js';

export class MemoryAdapter implements Adapter {
  private storage: Map<string, { payload: AdapterPayload; expiresAt?: number }> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  private key(id: string): string {
    return `${this.name}:${id}`;
  }

  private isExpired(item: { payload: AdapterPayload; expiresAt?: number }): boolean {
    return item.expiresAt ? item.expiresAt < Date.now() : false;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const key = this.key(id);
    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : undefined;

    this.storage.set(key, { payload, expiresAt });
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const key = this.key(id);
    const item = this.storage.get(key);

    if (!item) {
      return undefined;
    }

    if (this.isExpired(item)) {
      this.storage.delete(key);
      return undefined;
    }

    return item.payload;
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    // In memory implementation - scan all items
    for (const [key, item] of this.storage.entries()) {
      if (this.isExpired(item)) {
        this.storage.delete(key);
        continue;
      }

      if (item.payload.userCode === userCode) {
        return item.payload;
      }
    }

    return undefined;
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    // In memory implementation - scan all items
    for (const [key, item] of this.storage.entries()) {
      if (this.isExpired(item)) {
        this.storage.delete(key);
        continue;
      }

      if (item.payload.uid === uid) {
        return item.payload;
      }
    }

    return undefined;
  }

  async consume(id: string): Promise<void> {
    const payload = await this.find(id);
    if (!payload) {
      return;
    }

    await this.upsert(id, {
      ...payload,
      consumed: Math.floor(Date.now() / 1000),
    });
  }

  async destroy(id: string): Promise<void> {
    const key = this.key(id);
    this.storage.delete(key);
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, item] of this.storage.entries()) {
      if (item.payload.grantId === grantId) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.storage.delete(key);
    }
  }
}

export function createAdapter(storageType: 'sqlite' | 'memory') {
  return (name: string): Adapter => {
    if (storageType === 'sqlite') {
      logger.info({ name, storageType }, 'Creating SQLite adapter');
      return createSQLiteAdapter(name);
    }

    logger.warn({ name, storageType }, 'Using in-memory adapter (not recommended for production)');
    return new MemoryAdapter(name);
  };
}