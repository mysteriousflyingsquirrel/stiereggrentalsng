'use client'

/**
 * Admin authentication utilities for the Backoffice.
 *
 * ⚠️ SECURITY NOTE (MVP):
 * The "allowed email" check is CLIENT-SIDE only. A determined user could
 * bypass this by modifying the JS bundle. For production hardening:
 *   1. Set Firestore / Storage security rules that check custom claims
 *      (e.g. `request.auth.token.admin === true`).
 *   2. Use Firebase Admin SDK in a server endpoint to set custom claims
 *      after verifying the user's email.
 *   3. Optionally restrict the Firebase Auth sign-in methods so only
 *      the admin email can even authenticate.
 *
 * For now we gate the UI and routes by the allowed email env var.
 */

import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { auth } from './firebaseAuth'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trim + lowercase an email for safe comparison. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Read the allowed admin email from env (NEXT_PUBLIC_ prefix for Next.js). */
export function getAllowedAdminEmail(): string {
  return process.env.NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL ?? ''
}

/** Return `true` when `email` matches the allow-listed admin address. */
export function isAllowedAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false
  return normalizeEmail(email) === normalizeEmail(getAllowedAdminEmail())
}

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

/**
 * Sign in with email + password, then verify that the email is allow-listed.
 * If the email is NOT on the list the user is signed out immediately and an
 * error is thrown.
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password)

  if (!isAllowedAdminEmail(auth.currentUser?.email)) {
    await signOut(auth)
    throw new Error('Not authorized')
  }
}

/** Sign out the current admin user. */
export async function signOutAdmin(): Promise<void> {
  await signOut(auth)
}

// ---------------------------------------------------------------------------
// Subscription / hook
// ---------------------------------------------------------------------------

export interface AdminAuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

/**
 * Subscribe to Firebase auth state changes and derive `isAdmin`.
 * Returns an unsubscribe function.
 */
export function subscribeAdminAuth(
  cb: (state: AdminAuthState) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    cb({
      user,
      isAdmin: isAllowedAdminEmail(user?.email),
      loading: false,
    })
  })
}

/**
 * React hook that exposes the current admin auth state.
 *
 * ```tsx
 * const { user, isAdmin, loading } = useAdminAuth()
 * ```
 */
export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    const unsubscribe = subscribeAdminAuth(setState)
    return unsubscribe
  }, [])

  return state
}
