import fs from 'fs/promises';
import path from 'path';
import { generateKeyPair, exportJWK } from 'jose';
import { logger } from './logger.js';

export interface JWKSKeystore {
  keys: Array<{
    kty: string;
    kid: string;
    use: string;
    alg: string;
    n?: string;
    e?: string;
    d?: string;
    p?: string;
    q?: string;
    dp?: string;
    dq?: string;
    qi?: string;
    crv?: string;
    x?: string;
    y?: string;
  }>;
}

export class JWKSManager {
  private keystorePath: string;

  constructor(keystorePath: string) {
    this.keystorePath = keystorePath;
  }

  async ensureKeystore(): Promise<JWKSKeystore> {
    try {
      // Try to load existing keystore
      const keystore = await this.loadKeystore();
      
      // Validate that we have at least one signing key
      if (keystore.keys.length === 0) {
        logger.warn('No keys found in keystore, generating new keys');
        return await this.generateAndSaveKeystore();
      }
      
      logger.info(`Loaded JWKS keystore with ${keystore.keys.length} keys`);
      return keystore;
      
    } catch (error) {
      logger.info('JWKS keystore not found or invalid, creating new one');
      return await this.generateAndSaveKeystore();
    }
  }

  private async loadKeystore(): Promise<JWKSKeystore> {
    const data = await fs.readFile(this.keystorePath, 'utf-8');
    const keystore = JSON.parse(data) as JWKSKeystore;
    
    if (!keystore.keys || !Array.isArray(keystore.keys)) {
      throw new Error('Invalid keystore format');
    }
    
    return keystore;
  }

  private async generateAndSaveKeystore(): Promise<JWKSKeystore> {
    logger.info('Generating new RSA key pair for JWT signing');
    
    // Generate RSA key pair for JWT signing
    const { publicKey, privateKey } = await generateKeyPair('RS256', {
      modulusLength: 2048,
      extractable: true,
    });
    
    // Export keys as JWK
    const publicJWK = await exportJWK(publicKey);
    const privateJWK = await exportJWK(privateKey);
    
    // Generate unique key ID
    const kid = `key-${Date.now()}`;
    
    // Create the private key entry (includes both public and private components)
    const privateKeyEntry = {
      ...(privateJWK as any),
      kty: (privateJWK as any).kty ?? 'RSA',
      kid,
      use: 'sig',
      alg: 'RS256',
    };
    
    const keystore: JWKSKeystore = {
      keys: [privateKeyEntry]
    };
    
    // Ensure directory exists
    const dir = path.dirname(this.keystorePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Save keystore
    await fs.writeFile(this.keystorePath, JSON.stringify(keystore, null, 2));
    
    logger.info(`Generated and saved JWKS keystore to ${this.keystorePath}`, {
      keyId: kid,
      algorithm: 'RS256'
    });
    
    return keystore;
  }

  async getPublicKeys(): Promise<JWKSKeystore> {
    const keystore = await this.ensureKeystore();
    
    // Return only the public components for JWKS endpoint
    const publicKeys: JWKSKeystore = {
      keys: keystore.keys.map(key => ({
        kty: key.kty,
        kid: key.kid,
        use: key.use,
        alg: key.alg,
        ...(key.n && { n: key.n }),
        ...(key.e && { e: key.e }),
        ...(key.crv && { crv: key.crv }),
        ...(key.x && { x: key.x }),
        ...(key.y && { y: key.y }),
      }))
    };
    
    return publicKeys;
  }
}
