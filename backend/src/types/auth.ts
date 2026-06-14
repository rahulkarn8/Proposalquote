export type AuthMode = 'local' | 'cognito';
export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  cognitoSub?: string | null;
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

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
