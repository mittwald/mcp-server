import type { KoaContextWithOIDC } from 'oidc-provider';
import type { Middleware, DefaultState, DefaultContext } from 'koa';

export interface ProviderContext extends DefaultContext {
  oidc: KoaContextWithOIDC['oidc'];
}

export interface ProviderState extends DefaultState {}

export type ProviderMiddleware = Middleware<ProviderState, ProviderContext>;

export interface MittwaldTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
}

export interface UserSession {
  sub: string;
  mittwaldTokens?: MittwaldTokens;
  profile?: {
    name?: string;
    email?: string;
  };
}

export interface ClientMetadata {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  token_endpoint_auth_method: 'none' | 'client_secret_basic' | 'client_secret_post';
  application_type?: 'web' | 'native';
  contacts?: string[];
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
}

export interface DCRRequest {
  redirect_uris: string[];
  client_name?: string;
  application_type?: 'web' | 'native';
  contacts?: string[];
  logo_uri?: string;
  client_uri?: string;
  policy_uri?: string;
  tos_uri?: string;
}

export interface DCRResponse extends ClientMetadata {
  client_id: string;
  client_secret?: string;
  registration_access_token?: string;
  registration_client_uri?: string;
  client_id_issued_at?: number;
  client_secret_expires_at?: number;
}