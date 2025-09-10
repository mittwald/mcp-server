declare module 'oidc-provider' {
  import { Context, Middleware } from 'koa';

  export interface KoaContextWithOIDC extends Context {
    oidc: {
      uid: string;
      session: any;
      account: any;
      client: any;
      params: any;
      result: any;
      entities: any;
    };
  }

  export interface AdapterPayload {
    [key: string]: any;
  }

  export interface Adapter {
    upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void>;
    find(id: string): Promise<AdapterPayload | undefined>;
    findByUserCode?(userCode: string): Promise<AdapterPayload | undefined>;
    findByUid?(uid: string): Promise<AdapterPayload | undefined>;
    consume(id: string): Promise<void>;
    destroy(id: string): Promise<void>;
    revokeByGrantId(grantId: string): Promise<void>;
  }

  export interface Configuration {
    [key: string]: any;
  }

  export default class Provider {
    constructor(issuer: string, configuration?: Configuration);
    callback(): Middleware;
    InitialAccessToken: {
      find(token: string): Promise<any>;
      upsert(token: string, payload: any): Promise<any>;
    };
  }
}