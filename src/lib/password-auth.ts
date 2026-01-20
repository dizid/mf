import { cookies } from 'next/headers'
import { db, users } from './db'
import { eq } from 'drizzle-orm'

const AUTH_COOKIE_NAME = 'app_auth'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const DEFAULT_USER_EMAIL = 'owner@apprater.local'

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME)
  return authCookie?.value === 'authenticated'
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export function verifyPassword(password: string): boolean {
  const appPassword = process.env.APP_PASSWORD
  if (!appPassword) {
    console.error('APP_PASSWORD environment variable not set')
    return false
  }
  return password === appPassword
}

// Get or create a default user for database operations
export async function getDefaultUserId(): Promise<string> {
  // Check if default user exists
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEFAULT_USER_EMAIL))
    .limit(1)
    .then(rows => rows[0])

  if (existingUser) {
    return existingUser.id
  }

  // Create default user
  const [newUser] = await db
    .insert(users)
    .values({
      email: DEFAULT_USER_EMAIL,
      name: 'App Owner',
    })
    .returning({ id: users.id })

  return newUser.id
}

// Check if the current user has Pro subscription
export async function isProUser(): Promise<boolean> {
  const user = await db
    .select({ isProUser: users.isProUser })
    .from(users)
    .where(eq(users.email, DEFAULT_USER_EMAIL))
    .limit(1)
    .then(rows => rows[0])

  return user?.isProUser === 1
}
