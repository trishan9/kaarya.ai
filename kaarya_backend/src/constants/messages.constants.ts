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
  OAUTH_PROVIDER_NOT_SUPPORTED: 'OAuth provider is not supported.',
  OAUTH_UNAVAILABLE: 'Social login is temporarily unavailable.',
  OAUTH_INVALID_REQUEST: 'Invalid or expired social login request.',
  OAUTH_EMAIL_MISSING:
    'Your provider did not return a usable email address. For GitHub, verify your primary email and re-authorize this app with email access.',
  OAUTH_EMAIL_NOT_VERIFIED:
    'Please verify your email with your provider before signing in.',
  OAUTH_LINK_REQUIRED:
    'An account already exists for this email. Sign in to link this provider.',
  OAUTH_LINK_TOKEN_INVALID: 'Invalid or expired account linking session.',
  OAUTH_RESULT_FETCHED: 'Social login status fetched.',
  OAUTH_LINK_COMPLETED: 'Account linked successfully.',
  OAUTH_LINKED_ACCOUNTS_FETCHED: 'Linked accounts fetched successfully.',
  OAUTH_ACCOUNT_UNLINKED: 'Linked account removed successfully.',
  OAUTH_UNLINK_LAST_METHOD:
    'Cannot unlink this provider because it is your last sign-in method.',
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

export const COMPANY_MESSAGES = {
  NOT_FOUND: 'Company not found.',
  INVALID_ID: 'Invalid company id.',
  CREATE_SUCCESS: 'Company created successfully.',
  UPDATE_SUCCESS: 'Company updated successfully.',
  DELETE_SUCCESS: 'Company deleted successfully.',
  FETCH_SUCCESS: 'Company fetched successfully.',
  FETCH_ALL_SUCCESS: 'Companies fetched successfully.',
  RECRUITER_ALREADY_ASSIGNED:
    'Recruiter is already assigned to a different company.',
  RECRUITER_ROLE_REQUIRED: 'Only users with recruiter role can be assigned.',
  RECRUITER_PROFILE_MISSING:
    'Recruiter profile not found. Create or attach a company first.',
  RECRUITER_ATTACH_SUCCESS: 'Recruiter linked to company successfully.',
  RECRUITER_ASSIGN_SUCCESS: 'Recruiter assigned to company successfully.',
  RECRUITER_DELETE_SUCCESS: 'Recruiter removed from company successfully.',
  RECRUITER_NOT_IN_COMPANY:
    'Recruiter is not assigned to the specified company.',
  FORBIDDEN_COMPANY_ACCESS: 'You are not allowed to manage this company.',
  COMPANY_CONTEXT_REQUIRED:
    'companyId is required to perform this operation.',
  WORKSPACES_FETCH_SUCCESS: 'Recruiter workspaces fetched successfully.',
  JOIN_BY_CODE_SUCCESS: 'Joined company workspace successfully.',
  INVITE_CODE_RESET_SUCCESS: 'Company invite code reset successfully.',
  INVITE_CODE_INVALID: 'Invalid company invite code.',
  INVITE_CREATE_SUCCESS: 'Recruiter invite created successfully.',
  INVITEE_ROLE_REQUIRED:
    'Only users with recruiter role can accept recruiter invites.',
  INVITEE_ALREADY_IN_COMPANY: 'Recruiter is already assigned to this company.',
} as const;

export const JOB_MESSAGES = {
  NOT_FOUND: 'Job posting not found.',
  INVALID_ID: 'Invalid job posting id.',
  CREATE_SUCCESS: 'Job posting created successfully.',
  UPDATE_SUCCESS: 'Job posting updated successfully.',
  DELETE_SUCCESS: 'Job posting deleted successfully.',
  FETCH_SUCCESS: 'Job posting fetched successfully.',
  FETCH_ALL_SUCCESS: 'Job postings fetched successfully.',
  RECRUITER_COMPANY_REQUIRED:
    'Recruiter must be linked to a company before managing job postings.',
  FORBIDDEN_COMPANY_ACCESS:
    'You are not allowed to manage job postings for this company.',
  APPLICATIONS_FETCH_SUCCESS: 'Job applications fetched successfully.',
  MY_APPLICATIONS_FETCH_SUCCESS: 'Your job applications fetched successfully.',
  MY_APPLICATION_FETCH_SUCCESS: 'Your job application fetched successfully.',
  APPLICATION_CREATE_SUCCESS: 'Job application submitted successfully.',
  APPLICATION_UPDATE_SUCCESS: 'Job application updated successfully.',
  APPLICATION_RESUME_ACTIVITY_UPDATED:
    'Resume activity updated successfully.',
  APPLICATION_ALREADY_EXISTS: 'You have already applied for this job.',
  APPLICATION_NOT_FOUND: 'Job application not found.',
  APPLICATION_FORBIDDEN:
    'You are not allowed to apply or manage applications for this job.',
  VIEW_RECORDED: 'Job view recorded successfully.',
  METRICS_FETCH_SUCCESS: 'Job metrics fetched successfully.',
} as const;

export const RESPONSE_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Something went wrong.',
  VALIDATION_FAILED: 'Validation failed.',
} as const;

export const LOG_MESSAGES = {
  LOGIN_SUCCESS: 'Login completed.',
  SIGNUP_SUCCESS: 'Signup completed.',
  OAUTH_LOGIN_SUCCESS: 'OAuth login completed.',
  OAUTH_LINK_REQUIRED: 'OAuth link required.',
  OAUTH_LINK_COMPLETED: 'OAuth account linked.',
  PASSWORD_RESET_REQUEST: 'Password reset requested.',
  PASSWORD_RESET_VERIFIED: 'Password reset code verified.',
  PASSWORD_RESET_COMPLETED: 'Password reset completed.',
} as const;
