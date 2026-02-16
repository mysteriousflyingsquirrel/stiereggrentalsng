/**
 * Simple month-day string in the form "MM-DD"
 * Examples: "06-01" (1st June), "09-30" (30th September)
 */
export type MonthDay = `${string}-${string}`

/**
 * A date range described by start/end MonthDay strings.
 */
export type SeasonDateRange = { start: MonthDay; end: MonthDay }

/**
 * All season date ranges keyed by season ID (arbitrary string).
 */
export type SeasonDateRanges = Record<string, SeasonDateRange[]>

/**
 * Configuration for a single season.
 */
export type SeasonConfig = {
  id: string
  label: {
    de: string
    en: string
  }
  color: string // hex colour, e.g. "#EF4444"
}

// ---------------------------------------------------------------------------
// Pure logic functions — accept date ranges as a parameter so the caller
// can supply data from Firestore.
// ---------------------------------------------------------------------------

function toMonthDayNumber(date: Date): number {
  const month = date.getMonth() + 1 // 1–12
  const day = date.getDate()
  return month * 100 + day // e.g. 6 June -> 606
}

export function parseMonthDay(md: MonthDay): number {
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
 * Return all season IDs whose date ranges include the given date.
 * Iterates over every key in the provided dateRanges record.
 *
 * @param date The date to check
 * @param dateRanges Season date ranges (from Firestore)
 */
export function getActiveSeasonIdsForDate(
  date: Date,
  dateRanges: SeasonDateRanges = {}
): string[] {
  if (isNaN(date.getTime())) {
    return []
  }

  const active: string[] = []

  for (const [seasonId, ranges] of Object.entries(dateRanges)) {
    if (!ranges || ranges.length === 0) continue
    if (ranges.some((range) => isWithinRange(date, range.start, range.end))) {
      active.push(seasonId)
    }
  }

  return active
}

export function getActiveSeasonIdsForDateString(
  dateStr: string,
  dateRanges: SeasonDateRanges = {}
): string[] {
  const date = new Date(dateStr)
  return getActiveSeasonIdsForDate(date, dateRanges)
}

/**
 * Get the first matching season ID for a date.
 * Returns undefined if no season matches (= default applies).
 */
export function getSeasonIdForDate(
  date: Date,
  dateRanges: SeasonDateRanges = {}
): string | undefined {
  const active = getActiveSeasonIdsForDate(date, dateRanges)
  return active.length > 0 ? active[0] : undefined
}

export function getSeasonIdForDateString(
  dateStr: string,
  dateRanges: SeasonDateRanges = {}
): string | undefined {
  const date = new Date(dateStr)
  return getSeasonIdForDate(date, dateRanges)
}
