export const CustomerErrorCode = {
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    INVALID_EMAIL: 'INVALID_EMAIL',
    NAME_REQUIRED: 'NAME_REQUIRED',
    IMAGE_REQUIRED: 'IMAGE_REQUIRED',
    DATABASE_ERROR: 'DATABASE_ERROR',
  } as const;
  
  export type CustomerErrorCode =
    (typeof CustomerErrorCode)[keyof typeof CustomerErrorCode];
  
  export const customerErrorMessages: Record<
    CustomerErrorCode,
    (values?: { email?: string; name?: string }) => string
  > = {
    EMAIL_TAKEN: (v) =>
      v?.email
        ? `"${v.email}" is already in use. Please try a new email address.`
        : 'This email is already in use. Please try a new email address.',
  
    INVALID_EMAIL: () => 'Please enter a valid email address.',
  
    NAME_REQUIRED: () => 'Please enter a name.',
  
    IMAGE_REQUIRED: () => 'Please select or upload an avatar.',
  
    DATABASE_ERROR: () => 'Something went wrong. Please try again.',
  };