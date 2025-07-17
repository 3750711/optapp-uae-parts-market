export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  OPT_ID_NOT_FOUND = 'opt_id_not_found',
  TELEGRAM_AUTH_CONFLICT = 'telegram_auth_conflict',
  RATE_LIMITED = 'rate_limited',
  NETWORK_ERROR = 'network_error',
  GENERIC_ERROR = 'generic_error'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  actionText?: string;
  actionLink?: string;
}