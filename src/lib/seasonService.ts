import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { SeasonConfig, SeasonDateRange, MonthDay } from '@/data/seasons'

/**
 * Full season document as stored in Firestore.
 */
export type SeasonDocument = SeasonConfig & {
  dateRanges: SeasonDateRange[]
}

const COLLECTION = 'seasons'

/**
 * Fetch all season documents from Firestore.
 * Returns a record keyed by season ID (arbitrary strings).
 * Returns an empty record if no seasons exist.
 */
export async function fetchSeasons(): Promise<Record<string, SeasonDocument>> {
  const snapshot = await getDocs(collection(db, COLLECTION))

  const result: Record<string, SeasonDocument> = {}
  snapshot.docs.forEach((d) => {
    const raw = d.data()
    // Firestore returns plain strings; cast them to MonthDay template literals
    const dateRanges: SeasonDateRange[] = (raw.dateRanges ?? []).map(
      (r: { start: string; end: string }) => ({
        start: r.start as MonthDay,
        end: r.end as MonthDay,
      })
    )
    result[d.id] = {
      id: d.id,
      label: raw.label ?? { de: d.id, en: d.id },
      color: raw.color ?? '#6B7280', // default gray if missing
      dateRanges,
    }
  })

  return result
}

/**
 * Create or overwrite a season document.
 */
export async function setSeason(
  seasonId: string,
  data: SeasonDocument
): Promise<void> {
  const { id: _id, ...rest } = data
  await setDoc(doc(db, COLLECTION, seasonId), rest)
}

/**
 * Delete a season document by its ID.
 */
export async function deleteSeason(seasonId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, seasonId))
}
