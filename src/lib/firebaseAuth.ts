'use client'

/**
 * Firebase Auth – client-only initialisation.
 *
 * Separated from firebase.ts because firebase/auth relies on browser APIs
 * (browserLocalPersistence) which cannot be imported in server modules.
 */

import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { app } from './firebase'

export const auth = getAuth(app)

// Persist the auth session across browser restarts
setPersistence(auth, browserLocalPersistence).catch(console.error)
