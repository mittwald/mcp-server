export interface MailAddress {
  id: string;
  address: string;
  projectId: string;
  isCatchAll: boolean;
  mailbox?: {
    enabled: boolean;
    password?: string;
    quotaInBytes?: number;
    quotaUsageInBytes?: number;
  };
  forwardAddresses?: string[];
  autoResponder?: {
    enabled: boolean;
    subject?: string;
    message?: string;
  };
  spamProtection?: {
    enabled: boolean;
    folder?: string;
  };
}

export interface DeliveryBox {
  id: string;
  projectId: string;
  description: string;
  username: string;
  password?: string;
}

export interface MailSettings {
  projectId: string;
  blacklist?: string[];
  whitelist?: string[];
}

export interface CreateMailAddressRequest {
  address: string;
  isCatchAll: boolean;
  mailbox: {
    enableSpamProtection: boolean;
    password: string;
    quotaInBytes: number;
  };
}

export interface CreateForwardAddressRequest {
  address: string;
  forwardAddresses: string[];
}

export interface CreateDeliveryBoxRequest {
  description: string;
  password: string;
}

export interface UpdateMailAddressAddressRequest {
  address: string;
}

export interface UpdateMailAddressPasswordRequest {
  password: string;
}

export interface UpdateMailAddressQuotaRequest {
  quotaInBytes: number;
}

export interface UpdateMailAddressForwardAddressesRequest {
  forwardAddresses: string[];
}

export interface UpdateMailAddressAutoResponderRequest {
  autoResponder: {
    active: boolean;
    message: string;
    expiresAt?: string;
    startsAt?: string;
  } | null;
}

export interface UpdateMailAddressSpamProtectionRequest {
  spamProtection: {
    active: boolean;
    autoDeleteSpam: boolean;
    folder: "inbox" | "spam";
    relocationMinSpamScore: number;
  };
}

export interface UpdateMailAddressCatchAllRequest {
  active: boolean;
}

export interface UpdateDeliveryBoxDescriptionRequest {
  description: string;
}

export interface UpdateDeliveryBoxPasswordRequest {
  password: string;
}

export interface UpdateMailSettingBlacklistRequest {
  blacklist: string[];
}

export interface UpdateMailSettingWhitelistRequest {
  whitelist: string[];
}

export type MailErrorType = 
  | "MAIL_NOT_FOUND"
  | "DELIVERY_BOX_NOT_FOUND"
  | "INVALID_ADDRESS"
  | "VALIDATION_ERROR"
  | "API_ERROR"
  | "PERMISSION_DENIED";

export class MailError extends Error {
  constructor(
    message: string,
    public type: MailErrorType,
    public details?: any
  ) {
    super(message);
    this.name = "MailError";
  }
}