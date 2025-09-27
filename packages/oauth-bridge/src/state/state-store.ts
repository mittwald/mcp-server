export interface AuthorizationRequestRecord {
  state: string;
  internalState: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  resource?: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthorizationGrantRecord {
  authorizationCode: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  resource?: string;
  mittwaldAuthorizationCode: string;
  mittwaldTokens?: MittwaldTokenResponse;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface MittwaldTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface StateStore {
  storeAuthorizationRequest(record: AuthorizationRequestRecord): Promise<void>;
  getAuthorizationRequestByInternalState(internalState: string): Promise<AuthorizationRequestRecord | null>;
  deleteAuthorizationRequestByInternalState(internalState: string): Promise<void>;
  storeAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void>;
  getAuthorizationGrant(authorizationCode: string): Promise<AuthorizationGrantRecord | null>;
  updateAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void>;
  deleteAuthorizationGrant(authorizationCode: string): Promise<void>;
}
