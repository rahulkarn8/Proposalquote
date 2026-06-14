import type { AuthMode } from '../types/auth';

export const authConfig = {
  mode: (process.env.AUTH_MODE ?? 'local') as AuthMode,
  jwtSecret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  cognito: {
    region: process.env.COGNITO_REGION ?? '',
    userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    clientId: process.env.COGNITO_CLIENT_ID ?? '',
    adminGroup: process.env.COGNITO_ADMIN_GROUP ?? 'admin',
    userGroup: process.env.COGNITO_USER_GROUP ?? 'user',
  },
  local: {
    adminEmail: process.env.LOCAL_ADMIN_EMAIL ?? 'admin@motherson.com',
    adminPassword: process.env.LOCAL_ADMIN_PASSWORD ?? 'Admin123!',
    userEmail: process.env.LOCAL_USER_EMAIL ?? 'user@motherson.com',
    userPassword: process.env.LOCAL_USER_PASSWORD ?? 'User123!',
  },
};

export function isCognitoMode(): boolean {
  return authConfig.mode === 'cognito';
}

export function isCognitoConfigured(): boolean {
  const { region, userPoolId, clientId } = authConfig.cognito;
  return Boolean(region && userPoolId && clientId);
}
