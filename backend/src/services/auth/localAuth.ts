import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { authConfig } from '../../config/auth';
import { signAccessToken } from './jwt';
import type { AuthUser, LoginResponse } from '../../types/auth';

const prisma = new PrismaClient();

function toAuthUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  cognitoSub?: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cognitoSub: user.cognitoSub,
  };
}

export async function ensureLocalUsers(): Promise<void> {
  const users = [
    {
      email: authConfig.local.adminEmail,
      password: authConfig.local.adminPassword,
      name: 'Local Admin',
      role: UserRole.ADMIN,
    },
    {
      email: authConfig.local.userEmail,
      password: authConfig.local.userPassword,
      name: 'Local User',
      role: UserRole.USER,
    },
  ];

  for (const spec of users) {
    const existing = await prisma.user.findUnique({ where: { email: spec.email } });
    const passwordHash = await bcrypt.hash(spec.password, 10);
    if (existing) {
      await prisma.user.update({
        where: { email: spec.email },
        data: { passwordHash, role: spec.role, name: spec.name },
      });
    } else {
      await prisma.user.create({
        data: {
          email: spec.email,
          name: spec.name,
          passwordHash,
          role: spec.role,
        },
      });
    }
  }
}

export async function localLogin(email: string, password: string): Promise<LoginResponse> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user?.passwordHash) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const authUser = toAuthUser(user);
  const accessToken = signAccessToken(authUser);

  return {
    user: authUser,
    tokens: { accessToken },
    authMode: 'local',
  };
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toAuthUser(user) : null;
}
