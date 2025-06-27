import { mailAddressesSuccessMessages } from '../../../../constants/tool/mittwald/mail/mail-addresses.js';
import { MailError } from '../../../../types/mittwald/mail.js';
import { formatMittwaldToolResponse } from '../types.js';
import type { MittwaldToolHandler } from '../types.js';
import type {
  CreateMailAddressRequest,
  CreateForwardAddressRequest,
  UpdateMailAddressAddressRequest,
  UpdateMailAddressPasswordRequest,
  UpdateMailAddressQuotaRequest,
  UpdateMailAddressForwardAddressesRequest,
  UpdateMailAddressAutoResponderRequest,
  UpdateMailAddressSpamProtectionRequest,
} from '../../../../types/mittwald/mail.js';

// List mail addresses
export interface ListMailAddressesArgs {
  projectId: string;
  limit?: number;
  skip?: number;
}

export const handleListMailAddresses: MittwaldToolHandler<ListMailAddressesArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId, limit = 50, skip = 0 } = args;

    const response = await mittwaldClient.typedApi.mail.listMailAddresses({
      projectId,
      queryParameters: { limit, skip },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to list mail addresses', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.list,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to list mail addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Create mail address
export interface CreateMailAddressArgs {
  projectId: string;
  address: string;
  isCatchAll?: boolean;
  mailbox?: {
    enableSpamProtection: boolean;
    password: string;
    quotaInBytes: number;
  };
  forwardAddresses?: string[];
}

export const handleCreateMailAddress: MittwaldToolHandler<CreateMailAddressArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { projectId, address, isCatchAll, mailbox, forwardAddresses } = args;

    let requestBody: CreateMailAddressRequest | CreateForwardAddressRequest;

    if (forwardAddresses && forwardAddresses.length > 0) {
      // Create forward address
      requestBody = {
        address,
        forwardAddresses,
      };
    } else if (mailbox && isCatchAll !== undefined) {
      // Create mailbox address
      requestBody = {
        address,
        isCatchAll,
        mailbox,
      };
    } else {
      throw new MailError('Either mailbox or forwardAddresses must be provided', 'VALIDATION_ERROR');
    }

    const response = await mittwaldClient.typedApi.mail.createMailAddress({
      projectId,
      data: requestBody as any,
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to create mail address', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.create,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to create mail address: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Get mail address
export interface GetMailAddressArgs {
  mailAddressId: string;
}

export const handleGetMailAddress: MittwaldToolHandler<GetMailAddressArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId } = args;

    const response = await mittwaldClient.typedApi.mail.getMailAddress({
      mailAddressId,
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to get mail address', 'MAIL_NOT_FOUND', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.get,
      result: response.data,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to get mail address: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Delete mail address
export interface DeleteMailAddressArgs {
  mailAddressId: string;
}

export const handleDeleteMailAddress: MittwaldToolHandler<DeleteMailAddressArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId } = args;

    const response = await mittwaldClient.typedApi.mail.deleteMailAddress({
      mailAddressId,
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to delete mail address', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.delete,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to delete mail address: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address
export interface UpdateMailAddressAddressArgs extends UpdateMailAddressAddressRequest {
  mailAddressId: string;
}

export const handleUpdateMailAddressAddress: MittwaldToolHandler<UpdateMailAddressAddressArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, address } = args;

    const response = await mittwaldClient.typedApi.mail.updateMailAddressAddress({
      mailAddressId,
      data: { address },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update mail address', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateAddress,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update mail address: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address password
export interface UpdateMailAddressPasswordArgs extends UpdateMailAddressPasswordRequest {
  mailAddressId: string;
}

export const handleUpdateMailAddressPassword: MittwaldToolHandler<UpdateMailAddressPasswordArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, password } = args;

    const response = await mittwaldClient.typedApi.mail.updateMailAddressPassword({
      mailAddressId,
      data: { password },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update mail address password', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updatePassword,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update mail address password: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address quota
export interface UpdateMailAddressQuotaArgs extends UpdateMailAddressQuotaRequest {
  mailAddressId: string;
}

export const handleUpdateMailAddressQuota: MittwaldToolHandler<UpdateMailAddressQuotaArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, quotaInBytes } = args;

    const response = await mittwaldClient.typedApi.mail.updateMailAddressQuota({
      mailAddressId,
      data: { quotaInBytes },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update mail address quota', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateQuota,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update mail address quota: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address forward addresses
export interface UpdateMailAddressForwardAddressesArgs extends UpdateMailAddressForwardAddressesRequest {
  mailAddressId: string;
}

export const handleUpdateMailAddressForwardAddresses: MittwaldToolHandler<UpdateMailAddressForwardAddressesArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, forwardAddresses } = args;

    const response = await mittwaldClient.typedApi.mail.updateMailAddressForwardAddresses({
      mailAddressId,
      data: { forwardAddresses },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update forward addresses', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateForwardAddresses,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update forward addresses: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address autoresponder
export interface UpdateMailAddressAutoresponderArgs {
  mailAddressId: string;
  enabled: boolean;
  message?: string;
  expiresAt?: string;
  startsAt?: string;
}

export const handleUpdateMailAddressAutoresponder: MittwaldToolHandler<UpdateMailAddressAutoresponderArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, enabled, message, expiresAt, startsAt } = args;

    const autoResponderData: UpdateMailAddressAutoResponderRequest = {
      autoResponder: enabled && message ? {
        active: enabled,
        message,
        ...(expiresAt && { expiresAt }),
        ...(startsAt && { startsAt }),
      } : null,
    };

    const response = await mittwaldClient.typedApi.mail.updateMailAddressAutoresponder({
      mailAddressId,
      data: autoResponderData as any,
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update autoresponder', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateAutoresponder,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update autoresponder: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address spam protection
export interface UpdateMailAddressSpamProtectionArgs {
  mailAddressId: string;
  enabled: boolean;
  folder?: "inbox" | "spam";
  autoDeleteSpam?: boolean;
  relocationMinSpamScore?: number;
}

export const handleUpdateMailAddressSpamProtection: MittwaldToolHandler<UpdateMailAddressSpamProtectionArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, enabled, folder = "spam", autoDeleteSpam = false, relocationMinSpamScore = 5 } = args;

    const spamProtectionData: UpdateMailAddressSpamProtectionRequest = {
      spamProtection: {
        active: enabled,
        folder,
        autoDeleteSpam,
        relocationMinSpamScore,
      },
    };

    const response = await mittwaldClient.typedApi.mail.updateMailAddressSpamProtection({
      mailAddressId,
      data: spamProtectionData,
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update spam protection', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateSpamProtection,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update spam protection: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};

// Update mail address catch all
export interface UpdateMailAddressCatchAllArgs {
  mailAddressId: string;
  isCatchAll: boolean;
}

export const handleUpdateMailAddressCatchAll: MittwaldToolHandler<UpdateMailAddressCatchAllArgs> = async (
  args,
  { mittwaldClient }
) => {
  try {
    const { mailAddressId, isCatchAll } = args;

    const response = await mittwaldClient.typedApi.mail.updateMailAddressCatchAll({
      mailAddressId,
      data: { active: isCatchAll },
    });

    if (!String(response.status).startsWith('2')) {
      throw new MailError('Failed to update catch-all setting', 'API_ERROR', response);
    }

    return formatMittwaldToolResponse({
      message: mailAddressesSuccessMessages.updateCatchAll,
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: 'error',
      message: `Failed to update catch-all setting: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: {
        type: error instanceof MailError ? error.type : 'API_ERROR',
        details: error,
      },
    });
  }
};