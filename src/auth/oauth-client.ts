import * as openidClient from 'openid-client';
import { logger } from '../utils/logger.js';

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class MittwaldOAuthClient {
  private config: OAuthConfig;
  private discoveredConfiguration: any = null;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      // Discover OAuth endpoints from issuer
      this.discoveredConfiguration = await openidClient.discovery(
        new URL(this.config.issuer),
        this.config.clientId,
        this.config.clientSecret,
        undefined,
        {
          execute: [openidClient.allowInsecureRequests]
        }
      );

      logger.info('OAuth client initialized', {
        issuer: this.config.issuer,
        clientId: this.config.clientId,
        endpoints: {
          authorization: this.discoveredConfiguration.serverMetadata().authorization_endpoint,
          token: this.discoveredConfiguration.serverMetadata().token_endpoint,
          userinfo: this.discoveredConfiguration.serverMetadata().userinfo_endpoint
        }
      });
    } catch (error) {
      logger.error('Failed to initialize OAuth client', error);
      throw new Error(`OAuth client initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async generateAuthUrl(state: string): Promise<{ authUrl: string; codeVerifier: string; codeChallenge: string }> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);

    const authUrl = openidClient.buildAuthorizationUrl(this.discoveredConfiguration, {
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      redirect_uri: this.config.redirectUri,
    });

    return { authUrl: authUrl.href, codeVerifier, codeChallenge };
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string, state: string): Promise<any> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    try {
      // Create the callback URL with the authorization code
      const callbackUrl = new URL(this.config.redirectUri);
      callbackUrl.searchParams.set('code', code);
      callbackUrl.searchParams.set('state', state);

      const tokens = await openidClient.authorizationCodeGrant(
        this.discoveredConfiguration,
        callbackUrl,
        {
          pkceCodeVerifier: codeVerifier,
          expectedState: state
        }
      );

      logger.info('OAuth token exchange successful', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type
      });

      return tokens;
    } catch (error) {
      logger.error('OAuth token exchange failed', error);
      throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<any> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    try {
      const tokens = await openidClient.refreshTokenGrant(this.discoveredConfiguration, refreshToken);
      logger.info('OAuth token refresh successful');
      return tokens;
    } catch (error) {
      logger.error('OAuth token refresh failed', error);
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateToken(accessToken: string): Promise<boolean> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    try {
      const userInfo = await openidClient.fetchUserInfo(this.discoveredConfiguration, accessToken, openidClient.skipSubjectCheck);
      return !!userInfo.sub;
    } catch (error) {
      logger.debug('Token validation failed', error);
      return false;
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    try {
      const userInfo = await openidClient.fetchUserInfo(this.discoveredConfiguration, accessToken, openidClient.skipSubjectCheck);
      return userInfo;
    } catch (error) {
      logger.error('Failed to get user info', error);
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async revokeToken(token: string): Promise<void> {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }

    try {
      await openidClient.tokenRevocation(this.discoveredConfiguration, token);
      logger.info('Token revoked successfully');
    } catch (error) {
      logger.error('Token revocation failed', error);
      // Don't throw here as revocation might fail for already expired tokens
    }
  }

  getConfiguration(): any {
    if (!this.discoveredConfiguration) {
      throw new Error('OAuth client not initialized');
    }
    return this.discoveredConfiguration;
  }
}