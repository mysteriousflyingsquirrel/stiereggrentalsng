import { useState, useEffect } from 'react'
import type { SeasonDateRanges } from '@/data/seasons'
import { fetchSeasons, SeasonDocument } from '@/lib/seasonService'

/**
 * Hook to fetch season configuration (labels + date ranges + colors) from Firestore.
 * Returns an empty record if no seasons are configured.
 */
export function useSeasons() {
  const [seasons, setSeasons] = useState<Record<string, SeasonDocument>>({})
  const [seasonDateRanges, setSeasonDateRanges] = useState<SeasonDateRanges>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchSeasons()
      .then((data) => {
        if (cancelled) return

        setSeasons(data)

        // Build the SeasonDateRanges record from fetched documents
        const ranges: SeasonDateRanges = {}
        for (const [id, season] of Object.entries(data)) {
          ranges[id] = season.dateRanges
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
