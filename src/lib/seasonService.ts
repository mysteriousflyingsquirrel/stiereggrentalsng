import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { SeasonId, SeasonConfig, SeasonDateRange, MonthDay } from '@/data/seasons'

/**
 * Full season document as stored in Firestore.
 */
export type SeasonDocument = SeasonConfig & {
  dateRanges: SeasonDateRange[]
}

const COLLECTION = 'seasons'

/**
 * Fetch all season documents from Firestore.
 * Returns a record keyed by SeasonId.
 */
export async function fetchSeasons(): Promise<Record<SeasonId, SeasonDocument>> {
  const snapshot = await getDocs(collection(db, COLLECTION))

  const result: Partial<Record<SeasonId, SeasonDocument>> = {}
  snapshot.docs.forEach((d) => {
    const raw = d.data()
    // Firestore returns plain strings; cast them to MonthDay template literals
    const dateRanges: SeasonDateRange[] = (raw.dateRanges ?? []).map(
      (r: { start: string; end: string }) => ({
        start: r.start as MonthDay,
        end: r.end as MonthDay,
      })
    )
    result[d.id as SeasonId] = {
      id: d.id as SeasonId,
      label: raw.label,
      dateRanges,
    }
  })

  // Ensure all three seasons exist (fallback to sensible defaults)
  const defaults: Record<SeasonId, SeasonDocument> = {
    high: {
      id: 'high',
      label: { de: 'Hochsaison', en: 'High season' },
      dateRanges: [],
    },
    mid: {
      id: 'mid',
      label: { de: 'Zwischensaison', en: 'Mid season' },
      dateRanges: [],
    },
    low: {
      id: 'low',
      label: { de: 'Nebensaison', en: 'Low season' },
      dateRanges: [],
    },
  }

  return {
    high: result.high ?? defaults.high,
    mid: result.mid ?? defaults.mid,
    low: result.low ?? defaults.low,
  }
}

/**
 * Create or overwrite a season document.
 * Document ID equals the season ID (high | mid | low).
 */
export async function setSeason(
  seasonId: SeasonId,
  data: SeasonDocument
): Promise<void> {
  const { id: _id, ...rest } = data
  await setDoc(doc(db, COLLECTION, seasonId), rest)
}

/**
 * Partially update a season document.
 */
export async function updateSeason(
  seasonId: SeasonId,
  data: Partial<SeasonDocument>
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, seasonId), data as Record<string, unknown>)
}
