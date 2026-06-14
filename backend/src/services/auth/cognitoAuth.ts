import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
  AdminListGroupsForUserCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { PrismaClient, UserRole } from '@prisma/client';
import { authConfig } from '../../config/auth';
import type { AuthUser, LoginResponse } from '../../types/auth';

const prisma = new PrismaClient();

let jwtVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getClient(): CognitoIdentityProviderClient {
  return new CognitoIdentityProviderClient({ region: authConfig.cognito.region });
}

function getJwtVerifier() {
  if (!jwtVerifier) {
    jwtVerifier = CognitoJwtVerifier.create({
      userPoolId: authConfig.cognito.userPoolId,
      tokenUse: 'id',
      clientId: authConfig.cognito.clientId,
    });
  }
  return jwtVerifier;
}

async function resolveRoleFromGroups(username: string): Promise<UserRole> {
  try {
    const client = getClient();
    const result = await client.send(
      new AdminListGroupsForUserCommand({
        UserPoolId: authConfig.cognito.userPoolId,
        Username: username,
      })
    );
    const groups = (result.Groups ?? []).map((g) => g.GroupName?.toLowerCase() ?? '');
    if (groups.includes(authConfig.cognito.adminGroup.toLowerCase())) {
      return UserRole.ADMIN;
    }
  } catch {
    // Group lookup may fail without admin IAM permissions; fall back to USER
  }
  return UserRole.USER;
}

async function upsertCognitoUser(params: {
  email: string;
  name: string | null;
  cognitoSub: string;
  role: UserRole;
}): Promise<AuthUser> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ cognitoSub: params.cognitoSub }, { email: params.email }],
    },
  });

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: params.email,
          name: params.name,
          cognitoSub: params.cognitoSub,
          role: params.role,
        },
      })
    : await prisma.user.create({
        data: {
          email: params.email,
          name: params.name,
          cognitoSub: params.cognitoSub,
          role: params.role,
        },
      });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cognitoSub: user.cognitoSub,
  };
}

export async function cognitoLogin(email: string, password: string): Promise<LoginResponse> {
  const client = getClient();
  const auth = await client.send(
    new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: authConfig.cognito.clientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })
  );

  const result = auth.AuthenticationResult;
  if (!result?.AccessToken || !result.IdToken) {
    throw new Error('Cognito authentication failed');
  }

  const cognitoUser = await client.send(
    new GetUserCommand({ AccessToken: result.AccessToken })
  );

  const attrs = Object.fromEntries(
    (cognitoUser.UserAttributes ?? []).map((a) => [a.Name, a.Value])
  );
  const sub = attrs.sub ?? cognitoUser.Username ?? email;
  const userEmail = (attrs.email ?? email).toLowerCase();
  const name = attrs.name ?? attrs['custom:name'] ?? null;
  const role = await resolveRoleFromGroups(cognitoUser.Username ?? email);

  const user = await upsertCognitoUser({
    email: userEmail,
    name,
    cognitoSub: sub,
    role,
  });

  return {
    user,
    tokens: {
      accessToken: result.AccessToken,
      idToken: result.IdToken,
      refreshToken: result.RefreshToken,
      expiresIn: result.ExpiresIn,
    },
    authMode: 'cognito',
  };
}

export async function verifyCognitoIdToken(idToken: string): Promise<AuthUser> {
  const payload = await getJwtVerifier().verify(idToken);
  const email = String(payload.email ?? '').toLowerCase();
  const sub = String(payload.sub);
  const name = payload.name ? String(payload.name) : null;

  const role = await resolveRoleFromGroups(email);
  return upsertCognitoUser({ email, name, cognitoSub: sub, role });
}

export async function verifyCognitoAccessToken(accessToken: string): Promise<AuthUser> {
  const client = getClient();
  const cognitoUser = await client.send(new GetUserCommand({ AccessToken: accessToken }));

  const attrs = Object.fromEntries(
    (cognitoUser.UserAttributes ?? []).map((a) => [a.Name, a.Value])
  );
  const email = (attrs.email ?? cognitoUser.Username ?? '').toLowerCase();
  const sub = attrs.sub ?? cognitoUser.Username ?? email;
  const name = attrs.name ?? null;
  const role = await resolveRoleFromGroups(cognitoUser.Username ?? email);

  return upsertCognitoUser({ email, name, cognitoSub: sub, role });
}
