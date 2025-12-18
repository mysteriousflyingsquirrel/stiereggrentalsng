export type SeasonId = 'high' | 'low'

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
    // 1 June – 30 September
    { start: '06-01', end: '09-30' },
    // 1 December – 28 February
    { start: '12-01', end: '02-28' },
  ],
  low: [], // everything that is not high season
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
export function getSeasonIdForDate(date: Date): SeasonId {
  if (isNaN(date.getTime())) {
    return 'low'
  }

  const highRanges = seasonDateRanges.high
  const isHigh = highRanges.some(({ start, end }) => isWithinRange(date, start, end))

  return isHigh ? 'high' : 'low'
}

export function getSeasonIdForDateString(dateStr: string): SeasonId {
  const date = new Date(dateStr)
  return getSeasonIdForDate(date)
}


