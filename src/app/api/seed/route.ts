import { NextResponse } from 'next/server'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { apartments } from '@/data/apartments'

/**
 * One-time seed endpoint to populate Firestore with existing static data.
 *
 * GET /api/seed
 *
 * This will write all apartments and season configs to Firestore.
 * It skips documents that already exist (safe to call multiple times).
 *
 * ⚠️ Remove or protect this route after initial seeding!
 */

/** Hardcoded seed data for initial seasons (only used by this route). */
const SEED_SEASONS = [
  {
    id: 'high',
    label: { de: 'Hochsaison', en: 'High season' },
    color: '#EF4444',
    dateRanges: [
      { start: '12-20', end: '01-02' },
      { start: '01-24', end: '03-30' },
      { start: '06-06', end: '10-23' },
    ],
  },
  {
    id: 'mid',
    label: { de: 'Zwischensaison', en: 'Mid season' },
    color: '#F59E0B',
    dateRanges: [
      { start: '01-03', end: '01-23' },
      { start: '03-21', end: '06-05' },
    ],
  },
  {
    id: 'low',
    label: { de: 'Nebensaison', en: 'Low season' },
    color: '#22C55E',
    dateRanges: [],
  },
]

export async function GET() {
  try {
    const results: string[] = []

    // ---- Seed apartments ----
    for (const apartment of apartments) {
      const docRef = doc(db, 'apartments', apartment.slug)
      const existing = await getDoc(docRef)

      if (existing.exists()) {
        results.push(`⏭️  apartments/${apartment.slug} already exists, skipped`)
        continue
      }

      // Remove 'id' from the data (Firestore doc ID is the slug)
      const { id: _id, ...data } = apartment
      await setDoc(docRef, data)
      results.push(`✅  apartments/${apartment.slug} created`)
    }

    // ---- Seed seasons ----
    for (const season of SEED_SEASONS) {
      const docRef = doc(db, 'seasons', season.id)
      const existing = await getDoc(docRef)

      if (existing.exists()) {
        results.push(`⏭️  seasons/${season.id} already exists, skipped`)
        continue
      }

      const { id: _id, ...data } = season
      await setDoc(docRef, data)
      results.push(`✅  seasons/${season.id} created`)
    }

    return NextResponse.json({
      success: true,
      message: 'Seed completed',
      results,
    })
  } catch (error) {
    console.error('Seed failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
