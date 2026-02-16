import { useState, useEffect } from 'react'
import type { SeasonId } from '@/data/seasons'
import type { SeasonDateRanges } from '@/data/seasons'
import { DEFAULT_SEASON_DATE_RANGES } from '@/data/seasons'
import { fetchSeasons, SeasonDocument } from '@/lib/seasonService'

/**
 * Hook to fetch season configuration (labels + date ranges) from Firestore.
 * Falls back to the hardcoded defaults if Firestore is not yet seeded.
 */
export function useSeasons() {
  const [seasons, setSeasons] = useState<Record<SeasonId, SeasonDocument> | null>(null)
  const [seasonDateRanges, setSeasonDateRanges] = useState<SeasonDateRanges>(DEFAULT_SEASON_DATE_RANGES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchSeasons()
      .then((data) => {
        if (cancelled) return

        setSeasons(data)

        // Build the SeasonDateRanges record from the fetched documents
        const ranges: SeasonDateRanges = {
          high: data.high?.dateRanges ?? DEFAULT_SEASON_DATE_RANGES.high,
          mid: data.mid?.dateRanges ?? DEFAULT_SEASON_DATE_RANGES.mid,
          low: data.low?.dateRanges ?? DEFAULT_SEASON_DATE_RANGES.low,
        }
        setSeasonDateRanges(ranges)
      })
      .catch((err) => {
        console.error('Failed to fetch seasons:', err)
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { seasons, seasonDateRanges, loading, error }
}
