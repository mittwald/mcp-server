export interface MittwaldOAuthConfig {
  baseUrl: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  redirectUri: string;
}

export interface MittwaldTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface MittwaldTokenErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export interface MittwaldUserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
  updated_at?: number;
}

export interface MittwaldAuthorizationParams {
  response_type: 'code';
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export interface MittwaldTokenParams {
  grant_type: 'authorization_code' | 'refresh_token';
  client_id: string;
  code?: string;
  redirect_uri?: string;
  code_verifier?: string;
  refresh_token?: string;
}