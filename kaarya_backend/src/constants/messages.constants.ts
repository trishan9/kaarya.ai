export const AUTH_MESSAGES = {
  EMAIL_IN_USE: 'Email already in use.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  INVALID_TOKEN: 'Invalid token.',
  INVALID_RESET_CODE: 'Invalid or expired verification code.',
  INVALID_RESET_TOKEN: 'Invalid or expired reset token.',
  PASSWORD_RESET_REQUESTED:
    'If an account exists for this email, a reset code has been sent.',
  PASSWORD_RESET_VERIFIED: 'Reset code verified.',
  PASSWORD_RESET_SUCCESS: 'Password reset successful.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please try again later.',
  LOGIN_SUCCESS: 'Login successful.',
  SIGNUP_SUCCESS: 'Signup successful.',
  CURRENT_USER_SUCCESS: 'Current user fetched.',
} as const;

export const USER_MESSAGES = {
  NOT_FOUND: 'User not found.',
  INVALID_ID: 'Invalid user id.',
  FETCH_ALL_SUCCESS: 'Users fetched successfully.',
  FETCH_BY_EMAIL_SUCCESS: 'User fetched successfully.',
  FETCH_BY_ID_SUCCESS: 'User fetched successfully.',
  CREATE_SUCCESS: 'User created successfully.',
  UPDATE_SUCCESS: 'User updated successfully.',
  DELETE_SUCCESS: 'User deleted successfully.',
} as const;

export const RESPONSE_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Something went wrong.',
  VALIDATION_FAILED: 'Validation failed.',
} as const;

export const LOG_MESSAGES = {
  LOGIN_SUCCESS: 'Login completed.',
  SIGNUP_SUCCESS: 'Signup completed.',
  PASSWORD_RESET_REQUEST: 'Password reset requested.',
  PASSWORD_RESET_VERIFIED: 'Password reset code verified.',
  PASSWORD_RESET_COMPLETED: 'Password reset completed.',
} as const;
