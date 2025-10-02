/**
 * Compatibility shim for missing SDK methods
 * 
 * This module provides workarounds for methods that existed in previous
 * versions but are missing in the current Mittwald SDK v4.169.0
 */

import type { MittwaldAPIV2Client } from '@mittwald/api-client';

/**
 * Get current user info (replacement for missing getSelf method)
 */
export async function getSelf(client: MittwaldAPIV2Client) {
  try {
    // First get the token info to get userId
    const tokenResponse = await client.user.checkToken({});
    if (tokenResponse.status !== 200 || !tokenResponse.data?.id) {
      throw new Error('Unable to get current user ID from token');
    }
    
    // Then get the full user info
    const userResponse = await client.user.getUser({ 
      userId: tokenResponse.data.id 
    });
    
    if (userResponse.status !== 200) {
      throw new Error('Unable to get user information');
    }
    
    return {
      status: 200,
      data: userResponse.data
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Authenticate with session token (workaround using refreshSession)
 */
export async function authenticateWithSessionToken(
  client: MittwaldAPIV2Client, 
  sessionToken: string
) {
  try {
    // Use refreshSession as a workaround
    const response = await client.user.refreshSession({
      data: {
        refreshToken: sessionToken
      }
    });
    
    return response;
  } catch (error) {
    return {
      status: 401,
      data: null,
      error: 'Session token authentication not supported - using refresh as workaround'
    };
  }
}

/**
 * Resend email verification (not available in current SDK)
 */
export async function resendEmailVerification(client: MittwaldAPIV2Client) {
  return {
    status: 501,
    data: null,
    error: 'Email verification resend is not supported in the current SDK version'
  };
}

/**
 * Get support code (not available in current SDK)
 */
export async function getSupportCode(client: MittwaldAPIV2Client) {
  return {
    status: 501,
    data: null,
    error: 'Support code retrieval is not supported in the current SDK version'
  };
}

/**
 * Get personal information (possible workaround)
 */
export async function getPersonalInformation(client: MittwaldAPIV2Client) {
  try {
    // Try to get user info as a partial replacement
    const userInfo = await getSelf(client);
    if (userInfo.status === 200 && userInfo.data) {
      // Extract personal info from user data if available
      return {
        status: 200,
        data: {
          firstName: userInfo.data.person?.firstName,
          lastName: userInfo.data.person?.lastName,
          title: userInfo.data.person?.title,
          // Add other fields as available
        }
      };
    }
    
    return {
      status: 404,
      data: null,
      error: 'Personal information not available'
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Update user (possible workaround using updateAccount)
 */
export async function updateUser(
  client: MittwaldAPIV2Client,
  userId: string,
  data: { firstName?: string; lastName?: string }
) {
  try {
    // Try updateAccount as a workaround
    const response = await client.user.updateAccount({
      data: {
        person: {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
        }
      }
    });
    
    return response;
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: 'User update failed - updateAccount workaround unsuccessful'
    };
  }
}

/**
 * Refresh all sessions (only single session refresh available)
 */
export async function refreshAllSessions(client: MittwaldAPIV2Client) {
  return {
    status: 501,
    data: null,
    error: 'Bulk session refresh is not supported - use refreshSession for individual sessions'
  };
}