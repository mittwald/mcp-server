/**
 * Type definitions for Mittwald User API
 * @module types/mittwald/user
 */

// Authentication types
export interface AuthenticateRequest {
  email: string;
  password: string;
}

export interface AuthenticateResponse {
  token: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface AuthenticateMfaRequest {
  authenticationToken?: string;  // Not used in current API
  email?: string;
  password?: string;
  multiFactorCode: string;
}

export interface AuthenticateSessionTokenRequest {
  sessionToken: string;
}

export interface AuthenticateTokenRetrievalKeyRequest {
  tokenRetrievalKey: string;
  userId?: string;
}

// User types
export interface User {
  userId: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  avatarRefId?: string;
  created: string;
  lastLoginAt?: string;
  passwordUpdatedAt?: string;
}

export interface PersonalInformation {
  firstName?: string;
  lastName?: string;
  title?: string;
  dateOfBirth?: string;
  streetAddress?: string;
  zipCode?: string;
  city?: string;
  country?: string;
  state?: string;
  phoneNumbers?: PhoneNumber[];
}

export interface PhoneNumber {
  phoneNumber: string;
  label?: string;
  primary?: boolean;
  verified?: boolean;
}

// Session types
export interface Session {
  sessionId: string;
  tokenId: string;
  userId: string;
  createdAt: string;
  lastAccessedAt: string;
  userAgent?: string;
  ipAddress?: string;
  currentSession?: boolean;
}

// API Token types
export interface ApiToken {
  apiTokenId: string;
  name: string;
  description?: string;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  scopes?: string[];
}

export interface CreateApiTokenRequest {
  name: string;
  description?: string;
  expiresAt?: string;
  scopes?: string[];
}

// SSH Key types
export interface SshKey {
  sshKeyId: string;
  comment: string;
  fingerprint: string;
  publicKey: string;
  createdAt: string;
  algorithm?: string;
}

export interface CreateSshKeyRequest {
  publicKey: string;
  comment?: string;
}

// MFA types
export interface MfaStatus {
  confirmed: boolean;
  initialized: boolean;
  totp?: boolean;
  sms?: boolean;
}

export interface InitMfaRequest {
  type: 'totp' | 'sms';
}

export interface InitMfaResponse {
  secret?: string;
  qrCode?: string;
  recoveryCodes?: string[];
}

export interface ConfirmMfaRequest {
  multiFactorCode: string;
  recoveryCodes?: string[];
}

// Email management types
export interface ChangeEmailRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
  email?: string;
}

// Password management types
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface InitPasswordResetRequest {
  email: string;
}

export interface ConfirmPasswordResetRequest {
  token: string;
  password: string;
  userId?: string;
}

// Settings types
export interface UserSettings {
  language?: string;
  timezone?: string;
  theme?: 'light' | 'dark' | 'auto';
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
}

export interface NotificationSettings {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  marketing?: boolean;
  security?: boolean;
  updates?: boolean;
}

export interface PrivacySettings {
  profileVisibility?: 'public' | 'private' | 'contacts';
  showEmail?: boolean;
  showPhone?: boolean;
  activityTracking?: boolean;
}

// Avatar types
export interface RequestAvatarUploadRequest {
  fileName: string;
  mimeType: string;
}

export interface RequestAvatarUploadResponse {
  uploadUrl: string;
  avatarRefId: string;
  expiresAt: string;
}

// Feedback types
export interface CreateFeedbackRequest {
  subject: string;
  message: string;
  type?: 'bug' | 'feature' | 'improvement' | 'other';
  metadata?: Record<string, any>;
}

export interface Feedback {
  feedbackId: string;
  userId: string;
  subject: string;
  message: string;
  type: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

// Support types
export interface SupportCode {
  code: string;
  expiresAt: string;
}

export interface CreateIssueRequest {
  subject: string;
  message: string;
  type: 'technical' | 'billing' | 'general';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
}

export interface Issue {
  issueId: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt?: string;
  priority: string;
}

// Phone verification types
export interface AddPhoneNumberRequest {
  phoneNumber: string;
  primary?: boolean;
}

export interface VerifyPhoneRequest {
  verificationCode: string;
}

// Error types
export interface MittwaldError {
  type: string;
  message: string;
  code?: string;
  details?: Record<string, any>;
}