/**
 * TLS certificate operations
 */

import { executeApiCall } from './execute-api-call.js';
import type { LibraryFunctionBase, LibraryResult } from '../contracts/functions.js';

export interface ListCertificatesOptions extends LibraryFunctionBase {
  projectId: string;
}

export async function listCertificates(options: ListCertificatesOptions): Promise<LibraryResult<any[]>> {
  return executeApiCall(options.apiToken, (client) => client.domain.sslListCertificates({ queryParameters: { projectId: options.projectId } }));
}

export interface RequestCertificateOptions extends LibraryFunctionBase {
  projectId: string;
  commonName: string;
  contact: {
    city?: string;
    company?: string;
    country?: string;
    organizationalUnit?: string;
    state?: string;
  };
}

export async function requestCertificate(options: RequestCertificateOptions): Promise<LibraryResult<any>> {
  return executeApiCall(
    options.apiToken,
    (client) => client.domain.sslCreateCertificateRequest({
      data: {
        commonName: options.commonName,
        contact: options.contact,
        projectId: options.projectId
      }
    }),
    201
  );
}
