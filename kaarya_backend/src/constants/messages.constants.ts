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
  CHANGE_PASSWORD_SUCCESS: 'Password changed successfully.',
  CHANGE_PASSWORD_WRONG_CURRENT: 'Current password is incorrect.',
  CHANGE_PASSWORD_NO_PASSWORD:
    'Cannot change password for social-login-only accounts.',
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

export const COLLEGE_MESSAGES = {
  NOT_FOUND: 'College not found.',
  INVALID_ID: 'Invalid college id.',
  CREATE_SUCCESS: 'College created successfully.',
  UPDATE_SUCCESS: 'College updated successfully.',
  DELETE_SUCCESS: 'College deleted successfully.',
  FETCH_SUCCESS: 'College fetched successfully.',
  FETCH_ALL_SUCCESS: 'Colleges fetched successfully.',
  STUDENT_ROLE_REQUIRED: 'Only users with user/student role can join colleges.',
  COLLEGE_ROLE_REQUIRED: 'Only users with college role can manage colleges.',
  FORBIDDEN_COLLEGE_ACCESS: 'You are not allowed to manage this college.',
  COLLEGE_CONTEXT_REQUIRED: 'collegeId is required to perform this operation.',
  WORKSPACES_FETCH_SUCCESS: 'College workspaces fetched successfully.',
  JOIN_BY_CODE_SUCCESS: 'Joined college workspace successfully.',
  INVITE_CODE_RESET_SUCCESS: 'College invite code reset successfully.',
  INVITE_CODE_INVALID: 'Invalid college invite code.',
  INVITE_CREATE_SUCCESS: 'Student invite created successfully.',
  INVITEE_ALREADY_IN_COLLEGE: 'User is already a member of this college.',
  STUDENT_ASSIGN_SUCCESS: 'Student added to college successfully.',
  STUDENT_DELETE_SUCCESS: 'Student removed from college successfully.',
  STUDENT_NOT_IN_COLLEGE: 'Student is not assigned to the specified college.',
  METRICS_FETCH_SUCCESS: 'College metrics fetched successfully.',
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
  COLLEGE_WORKSPACE_REQUIRED:
    'College user must be linked to a college workspace before managing job postings.',
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

export const INTERVIEW_MESSAGES = {
  NOT_FOUND: 'Interview not found.',
  INVALID_ID: 'Invalid interview id.',
  CREATE_SUCCESS: 'Interview created successfully.',
  UPDATE_SUCCESS: 'Interview updated successfully.',
  DELETE_SUCCESS: 'Interview deleted successfully.',
  FETCH_SUCCESS: 'Interview fetched successfully.',
  FETCH_ALL_SUCCESS: 'Interviews fetched successfully.',
  FORBIDDEN_ACCESS: 'You are not allowed to access this interview.',
  FORBIDDEN_MANAGE: 'You are not allowed to manage this interview.',
  FORBIDDEN_CREATE:
    'You are not allowed to create workspace interviews for this role.',
  COMPANY_CONTEXT_REQUIRED:
    'companyId is required (or select a single recruiter workspace).',
  QUESTIONS_REQUIRED:
    'Interview questions are required. Enable AI generation or provide custom questions.',
  SESSION_START_SUCCESS: 'Interview session started successfully.',
  SESSION_COMPLETE_SUCCESS: 'Interview session completed successfully.',
  SESSION_FETCH_SUCCESS: 'Interview sessions fetched successfully.',
  INVALID_SESSION_ID: 'Invalid interview session id.',
  SESSION_NOT_FOUND: 'Interview session not found.',
  SESSION_MISMATCH: 'Session does not belong to this interview.',
  SESSION_FORBIDDEN: 'You are not allowed to access this interview session.',
  SESSION_ROLE_FORBIDDEN:
    'Only candidate users can take interview sessions. Recruiters, colleges, and admins can create/manage interviews and review participant feedback.',
  EVALUATION_FETCH_SUCCESS: 'Interview feedback fetched successfully.',
  EVALUATION_NOT_FOUND: 'Interview feedback not found.',
  ANALYTICS_FETCH_SUCCESS: 'Interview analytics fetched successfully.',
  VAPI_CREATION_CONFIG_SUCCESS:
    'VAPI voice interview creation config fetched successfully.',
  VAPI_GENERATE_SUCCESS:
    'Interview generated successfully from VAPI voice workflow.',
  VAPI_WEB_TOKEN_MISSING:
    'VAPI_WEB_TOKEN is missing. Configure VAPI web token for voice interview workflows.',
  VAPI_WORKFLOW_MISSING:
    'VAPI workflow id is missing. Configure workflow for voice interview creation.',
  VAPI_WEBHOOK_SECRET_MISSING:
    'VAPI webhook secret is not configured. Set VAPI_WEBHOOK_SECRET or VAPI_PRIVATE_KEY.',
  VAPI_WEBHOOK_UNAUTHORIZED: 'Unauthorized VAPI webhook request.',
  VAPI_USER_REQUIRED: 'Voice interview creation payload requires user id.',
  VAPI_ROLE_REQUIRED: 'Voice interview creation payload requires role.',
} as const;

export const LEADERBOARD_MESSAGES = {
  FETCH_SUCCESS: 'Leaderboard fetched successfully.',
  FORBIDDEN: 'You are not allowed to view this leaderboard.',
} as const;

export const BOOKMARK_MESSAGES = {
  FETCH_SUCCESS: 'Saved bookmarks fetched successfully.',
  SAVE_JOB_SUCCESS: 'Job saved successfully.',
  UNSAVE_JOB_SUCCESS: 'Job removed from saved successfully.',
  SAVE_INTERVIEW_SUCCESS: 'Interview saved successfully.',
  UNSAVE_INTERVIEW_SUCCESS: 'Interview removed from saved successfully.',
  FORBIDDEN: 'Only candidate users can manage saved bookmarks.',
} as const;

export const RESOURCE_MESSAGES = {
  NOT_FOUND: 'Resource course not found.',
  INVALID_ID: 'Invalid resource course id.',
  CREATE_SUCCESS: 'Resource course created successfully.',
  UPDATE_SUCCESS: 'Resource course updated successfully.',
  DELETE_SUCCESS: 'Resource course deleted successfully.',
  FETCH_SUCCESS: 'Resource course fetched successfully.',
  FETCH_ALL_SUCCESS: 'Resource courses fetched successfully.',
  FORBIDDEN_ACCESS: 'You are not allowed to access this resource course.',
  FORBIDDEN_MANAGE: 'You are not allowed to manage this resource course.',
  FORBIDDEN_CREATE: 'You are not allowed to create this type of resource course.',
  RECRUITER_WORKSPACE_REQUIRED:
    'Recruiter must be linked to a company workspace before creating resource courses.',
  COLLEGE_WORKSPACE_REQUIRED:
    'College user must be linked to a college workspace before creating resource courses.',
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
