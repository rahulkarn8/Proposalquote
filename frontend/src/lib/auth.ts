export type UserRole = 'USER' | 'ADMIN';
export type AuthMode = 'local' | 'cognito';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
  authMode: AuthMode;
}

export interface AuthConfig {
  mode: AuthMode;
  cognito: {
    region: string;
    userPoolId: string;
    clientId: string;
  } | null;
}

const STORAGE_KEY = 'mi_quote_auth';

export interface StoredAuth {
  user: AuthUser;
  tokens: AuthTokens;
  authMode: AuthMode;
}

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(auth: StoredAuth): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const auth = loadStoredAuth();
  if (!auth?.tokens.accessToken) return {};
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.tokens.accessToken}`,
  };
  if (auth.tokens.idToken) {
    headers['X-Cognito-Id-Token'] = auth.tokens.idToken;
  }
  return headers;
}
