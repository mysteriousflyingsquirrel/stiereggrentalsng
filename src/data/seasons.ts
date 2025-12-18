export type SeasonId = 'high' | 'mid' | 'low'

/**
 * Configuration for a season.
 * At the moment this only holds labels; date ranges are defined separately
 * so they are easy to adjust without touching logic.
 */
export type SeasonConfig = {
  id: SeasonId
  label: {
    de: string
    en: string
  }
}

export const seasons: Record<SeasonId, SeasonConfig> = {
  high: {
    id: 'high',
    label: {
      de: 'Hochsaison',
      en: 'High season',
    },
  },
  mid: {
    id: 'mid',
    label: {
      de: 'Zwischensaison',
      en: 'Mid season',
    },
  },
  low: {
    id: 'low',
    label: {
      de: 'Nebensaison',
      en: 'Low season',
    },
  },
}

/**
 * Simple month-day string in the form "MM-DD"
 * Examples: "06-01" (1st June), "09-30" (30th September)
 */
type MonthDay = `${string}-${string}`

/**
 * Developer-friendly season date ranges.
 *
 * All ranges are interpreted as "every year between these dates".
 * If a range crosses the year boundary (e.g. "12-01" to "02-28"),
 * it is treated as wrapping over New Year.
 */
const seasonDateRanges: Record<SeasonId, { start: MonthDay; end: MonthDay }[]> = {
  high: [
    // 20 Dec – 2 Jan
    { start: '12-20', end: '01-02' },
    // 24 Jan – 30 Mar
    { start: '01-24', end: '03-30' },
    // 6 Jun – 23 Oct
    { start: '06-06', end: '10-23' },
  ],
  mid: [
    // 3 Jan – 23 Jan
    { start: '01-03', end: '01-23' },
    // 21 Mar – 5 Jun
    { start: '03-21', end: '06-05' },
  ],
  // Everything that is not high or mid season is low season
  low: [],
}

function toMonthDayNumber(date: Date): number {
  const month = date.getMonth() + 1 // 1–12
  const day = date.getDate()
  return month * 100 + day // e.g. 6 June -> 606
}

function parseMonthDay(md: MonthDay): number {
  const [m, d] = md.split('-').map((v) => parseInt(v, 10))
  return m * 100 + d
}

function isWithinRange(date: Date, start: MonthDay, end: MonthDay): boolean {
  const value = toMonthDayNumber(date)
  const startVal = parseMonthDay(start)
  const endVal = parseMonthDay(end)

  if (isNaN(startVal) || isNaN(endVal)) {
    return false
  }

  // Non-wrapping range, e.g. 06-01 to 09-30
  if (startVal <= endVal) {
    return value >= startVal && value <= endVal
  }

  // Wrapping range over year boundary, e.g. 12-01 to 02-28
  return value >= startVal || value <= endVal
}

/**
 * Determine which season a given date falls into.
 *
 * High season ranges are defined in `seasonDateRanges.high` (using MM-DD strings).
 * Low season is simply any date that is not in a high season range.
 */
/**
 * Return all season IDs whose date ranges include the given date.
 * Does NOT include "low" explicitly – low is defined as "not in any other season".
 */
export function getActiveSeasonIdsForDate(date: Date): SeasonId[] {
  if (isNaN(date.getTime())) {
    return []
  }

  const active: SeasonId[] = []

  ;(['high', 'mid'] as SeasonId[]).forEach((seasonId: SeasonId) => {
    const ranges = seasonDateRanges[seasonId] || []
    if (ranges.some((range) => isWithinRange(date, range.start, range.end))) {
      active.push(seasonId)
    }
  })

  return active
}

export function getActiveSeasonIdsForDateString(dateStr: string): SeasonId[] {
  const date = new Date(dateStr)
  return getActiveSeasonIdsForDate(date)
}

/**
 * Kept for backwards compatibility where only a single season is needed.
 * If multiple seasons match, prefers high, then mid, otherwise low.
 */
export function getSeasonIdForDate(date: Date): SeasonId {
  const active = getActiveSeasonIdsForDate(date)
  if (active.includes('high')) return 'high'
  if (active.includes('mid')) return 'mid'
  return 'low'
}

export function getSeasonIdForDateString(dateStr: string): SeasonId {
  const date = new Date(dateStr)
  return getSeasonIdForDate(date)
}


