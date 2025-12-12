import ical from 'node-ical'
import { unstable_cache } from 'next/cache'

export type BookedRange = {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
}

const CACHE_TTL = 30 * 60 // 30 minutes in seconds

/**
 * Fetches and parses an iCal feed, returning booked date ranges
 */
async function fetchAndParseIcal(url: string): Promise<BookedRange[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: CACHE_TTL },
    })

    if (!response.ok) {
      console.error(`Failed to fetch iCal from ${url}: ${response.statusText}`)
      return []
    }

    const icalData = await response.text()
    const events = ical.parseICS(icalData)

    const bookedRanges: BookedRange[] = []

    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT') {
        const start = event.start as Date
        const end = event.end as Date

        if (start && end) {
          // Convert to date-only strings (YYYY-MM-DD) in local timezone
          // This ensures we don't shift dates due to UTC conversion
          const startDate = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
          )
          const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())

          // Format as YYYY-MM-DD
          const startStr = startDate.toISOString().split('T')[0]
          const endStr = endDate.toISOString().split('T')[0]

          bookedRanges.push({
            start: startStr,
            end: endStr,
          })
        }
      }
    }

    return bookedRanges
  } catch (error) {
    console.error(`Error parsing iCal from ${url}:`, error)
    return []
  }
}

/**
 * Merges multiple iCal feeds into a single set of booked ranges
 */
export async function getBookedRanges(icalUrls: string[]): Promise<BookedRange[]> {
  if (icalUrls.length === 0) {
    return []
  }

  // Fetch all iCal feeds in parallel
  const allRanges = await Promise.all(icalUrls.map((url) => fetchAndParseIcal(url)))

  // Flatten and merge ranges
  const merged: BookedRange[] = []
  const allDates = new Set<string>()

  for (const ranges of allRanges) {
    for (const range of ranges) {
      // Add all dates in the range to the set
      const start = new Date(range.start)
      const end = new Date(range.end)

      let current = new Date(start)
      while (current <= end) {
        allDates.add(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    }
  }

  // Convert set of dates back to ranges (simplified - could be optimized)
  const sortedDates = Array.from(allDates).sort()
  if (sortedDates.length === 0) {
    return []
  }

  let rangeStart = sortedDates[0]
  let rangeEnd = sortedDates[0]

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i]
    const prev = sortedDates[i - 1]
    const prevDate = new Date(prev)
    const currentDate = new Date(current)
    prevDate.setDate(prevDate.getDate() + 1)

    if (prevDate.toISOString().split('T')[0] === current) {
      // Consecutive date, extend range
      rangeEnd = current
    } else {
      // Gap found, save current range and start new one
      merged.push({ start: rangeStart, end: rangeEnd })
      rangeStart = current
      rangeEnd = current
    }
  }

  // Add the last range
  merged.push({ start: rangeStart, end: rangeEnd })

  return merged
}

/**
 * Cached version of getBookedRanges using Next.js unstable_cache
 * Note: Each apartment's URLs are used as part of the cache key
 */
export async function getCachedBookedRanges(icalUrls: string[]): Promise<BookedRange[]> {
  if (icalUrls.length === 0) {
    return []
  }

  // Create a cache key based on the URLs
  const cacheKey = `booked-ranges-${icalUrls.sort().join('-')}`

  return unstable_cache(
    async () => {
      return getBookedRanges(icalUrls)
    },
    [cacheKey],
    {
      revalidate: CACHE_TTL,
    }
  )()
}

