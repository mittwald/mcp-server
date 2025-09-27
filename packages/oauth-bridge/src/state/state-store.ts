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

export interface StateStore {
  storeAuthorizationRequest(record: AuthorizationRequestRecord): Promise<void>;
  getAuthorizationRequest(state: string): Promise<AuthorizationRequestRecord | null>;
  deleteAuthorizationRequest(state: string): Promise<void>;
}
