import ical from 'node-ical'
import { unstable_cache } from 'next/cache'

export type BookedRange = {
  start: string // YYYY-MM-DD
  end: string // YYYY-MM-DD
}

const CACHE_TTL = 30 * 60 // 30 minutes in seconds
const MAX_AIRBNB_EVENT_DAYS = 60

function isAirbnbIcalUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes('airbnb.')
  } catch {
    return /airbnb\./i.test(url)
  }
}

function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addUtcDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + days))
  return next.toISOString().slice(0, 10)
}

function calendarDaySpan(start: string, end: string): number {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
  const endUtc = Date.UTC(endYear, endMonth - 1, endDay)
  return (endUtc - startUtc) / (1000 * 60 * 60 * 24)
}

function isAllDayEvent(event: { datetype?: string; start?: Date; end?: Date }): boolean {
  if (event.datetype === 'date') return true
  const start = event.start as (Date & { dateOnly?: boolean }) | undefined
  const end = event.end as (Date & { dateOnly?: boolean }) | undefined
  return Boolean(start?.dateOnly || end?.dateOnly)
}

/**
 * Fetches and parses an iCal feed, returning booked date ranges
 */
async function fetchAndParseIcal(url: string): Promise<BookedRange[]> {
  const skipLongAirbnbEvents = isAirbnbIcalUrl(url)

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
          const startStr = toDateString(start)
          let endStr = toDateString(end)

          // RFC 5545: all-day DTEND is exclusive (the day after the last booked night)
          if (isAllDayEvent(event)) {
            endStr = addUtcDays(endStr, -1)
          }

          if (endStr < startStr) continue

          if (skipLongAirbnbEvents && calendarDaySpan(startStr, endStr) > MAX_AIRBNB_EVENT_DAYS) {
            continue
          }

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

function mergeRanges(ranges: BookedRange[]): BookedRange[] {
  const allDates = new Set<string>()

  for (const range of ranges) {
    let current = range.start
    while (current <= range.end) {
      allDates.add(current)
      current = addUtcDays(current, 1)
    }
  }

  const sortedDates = Array.from(allDates).sort()
  if (sortedDates.length === 0) {
    return []
  }

  const merged: BookedRange[] = []
  let rangeStart = sortedDates[0]
  let rangeEnd = sortedDates[0]

  for (let i = 1; i < sortedDates.length; i++) {
    const current = sortedDates[i]
    if (addUtcDays(rangeEnd, 1) === current) {
      rangeEnd = current
    } else {
      merged.push({ start: rangeStart, end: rangeEnd })
      rangeStart = current
      rangeEnd = current
    }
  }

  merged.push({ start: rangeStart, end: rangeEnd })
  return merged
}

/**
 * Merges multiple iCal feeds into a single set of booked ranges
 */
export async function getBookedRanges(icalUrls: string[]): Promise<BookedRange[]> {
  if (icalUrls.length === 0) {
    return []
  }

  const allRanges = await Promise.all(icalUrls.map((url) => fetchAndParseIcal(url)))
  return mergeRanges(allRanges.flat())
}

/**
 * Cached version of getBookedRanges using Next.js unstable_cache
 * Note: Each apartment's URLs are used as part of the cache key
 */
export async function getCachedBookedRanges(icalUrls: string[]): Promise<BookedRange[]> {
  if (icalUrls.length === 0) {
    return []
  }

  const cacheKey = `booked-ranges-v5-${icalUrls.sort().join('-')}`

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
