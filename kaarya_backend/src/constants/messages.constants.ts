export const AUTH_MESSAGES = {
  EMAIL_IN_USE: 'Email already in use.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  INVALID_TOKEN: 'Invalid token.',
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
} as const;
