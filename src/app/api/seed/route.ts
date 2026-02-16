import { NextResponse } from 'next/server'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { apartments } from '@/data/apartments'
import { DEFAULT_SEASONS, DEFAULT_SEASON_DATE_RANGES, SeasonId } from '@/data/seasons'

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
    const seasonIds: SeasonId[] = ['high', 'mid', 'low']
    for (const seasonId of seasonIds) {
      const docRef = doc(db, 'seasons', seasonId)
      const existing = await getDoc(docRef)

      if (existing.exists()) {
        results.push(`⏭️  seasons/${seasonId} already exists, skipped`)
        continue
      }

      const seasonConfig = DEFAULT_SEASONS[seasonId]
      const dateRanges = DEFAULT_SEASON_DATE_RANGES[seasonId]

      await setDoc(docRef, {
        label: seasonConfig.label,
        dateRanges,
      })
      results.push(`✅  seasons/${seasonId} created`)
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
