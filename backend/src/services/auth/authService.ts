import { authConfig, isCognitoMode, isCognitoConfigured } from '../../config/auth';
import { localLogin, ensureLocalUsers, getUserById } from './localAuth';
import {
  cognitoLogin,
  verifyCognitoIdToken,
  verifyCognitoAccessToken,
} from './cognitoAuth';
import { verifyAccessToken, payloadToAuthUser } from './jwt';
import type { AuthUser, LoginResponse, AuthMode } from '../../types/auth';

export async function initAuth(): Promise<void> {
  if (isCognitoMode()) {
    if (!isCognitoConfigured()) {
      console.warn('⚠️  AUTH_MODE=cognito but COGNITO_REGION/USER_POOL_ID/CLIENT_ID not set');
    }
    return;
  }
  await ensureLocalUsers();
  console.log('🔐 Local auth ready — admin:', authConfig.local.adminEmail, '| user:', authConfig.local.userEmail);
}

export function getAuthMode(): AuthMode {
  return authConfig.mode;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (isCognitoMode()) {
    if (!isCognitoConfigured()) {
      throw new Error('Cognito is not configured. Set COGNITO_REGION, COGNITO_USER_POOL_ID, and COGNITO_CLIENT_ID.');
    }
    return cognitoLogin(email, password);
  }
  return localLogin(email, password);
}

export async function resolveUserFromToken(
  authorizationHeader: string | undefined,
  cognitoIdTokenHeader?: string
): Promise<AuthUser | null> {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice(7);

  if (isCognitoMode()) {
    try {
      if (cognitoIdTokenHeader) {
        return await verifyCognitoIdToken(cognitoIdTokenHeader);
      }
      return await verifyCognitoAccessToken(token);
    } catch {
      return null;
    }
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await getUserById(payload.sub);
    return user ?? payloadToAuthUser(payload);
  } catch {
    return null;
  }
}

export async function getAuthConfigPublic() {
  return {
    mode: getAuthMode(),
    cognito: isCognitoMode()
      ? {
          region: authConfig.cognito.region,
          userPoolId: authConfig.cognito.userPoolId,
          clientId: authConfig.cognito.clientId,
        }
      : null,
  };
}
