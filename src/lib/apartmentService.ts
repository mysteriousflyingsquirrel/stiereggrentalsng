import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Apartment } from '@/data/apartments'

const COLLECTION = 'apartments'

/**
 * Fetch all apartments from Firestore, ordered by slug.
 */
export async function fetchApartments(): Promise<Apartment[]> {
  const q = query(collection(db, COLLECTION), orderBy('slug'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Apartment))
}

/**
 * Fetch a single apartment by its slug.
 * The Firestore document ID equals the slug.
 */
export async function fetchApartmentBySlug(
  slug: string
): Promise<Apartment | undefined> {
  const docRef = doc(db, COLLECTION, slug)
  const snap = await getDoc(docRef)
  if (!snap.exists()) return undefined
  return { ...snap.data(), id: snap.id } as Apartment
}

/**
 * Create a new apartment document.
 * Uses the slug as the document ID so look-ups by slug are O(1).
 */
export async function createApartment(
  apartment: Apartment
): Promise<void> {
  const { id: _id, ...data } = apartment
  await setDoc(doc(db, COLLECTION, apartment.slug), data)
}

/**
 * Update an existing apartment (partial update).
 */
export async function updateApartment(
  slug: string,
  data: Partial<Apartment>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, slug), data as Record<string, unknown>)
}

/**
 * Delete an apartment by slug.
 */
export async function deleteApartment(slug: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, slug))
}
