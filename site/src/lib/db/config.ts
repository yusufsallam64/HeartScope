export const DB_CONFIG = {
  name: "DB",
  collections: {
    users: 'users',
    accounts: 'accounts',
    sessions: 'sessions',
    analyses: 'analyses',
    verificationTokens: 'verification_tokens'
  } as const
};

export type CollectionName = keyof typeof DB_CONFIG.collections;