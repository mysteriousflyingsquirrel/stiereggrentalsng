import { BookedRange } from './availability'
import { Apartment } from '@/data/apartments'
import { getSeasonIdForDateString, SeasonId } from '@/data/seasons'

/**
 * Checks if an apartment is available for the given date range
 * @param bookedRanges Array of booked date ranges
 * @param checkIn Check-in date (YYYY-MM-DD)
 * @param checkOut Check-out date (YYYY-MM-DD)
 * @returns true if available, false if any date in the range is booked
 */
export function isApartmentAvailable(
  bookedRanges: BookedRange[],
  checkIn: string,
  checkOut: string
): boolean {
  if (!checkIn || !checkOut) return true // No dates selected means show as available

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  // Validate dates
  if (checkInDate >= checkOutDate) return false

  // Check if any date in the range overlaps with booked ranges
  for (const range of bookedRanges) {
    const bookedStart = new Date(range.start)
    const bookedEnd = new Date(range.end)

    // Check if there's any overlap
    // The range overlaps if:
    // - checkIn is before bookedEnd AND checkOut is after bookedStart
    if (checkInDate <= bookedEnd && checkOutDate >= bookedStart) {
      return false
    }
  }

  return true
}

/**
 * Calculate number of nights between two dates
 */
export function getStayNights(checkIn: string, checkOut: string): number {
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)

  // Normalize to midnight to avoid DST/timezone issues
  inDate.setHours(0, 0, 0, 0)
  outDate.setHours(0, 0, 0, 0)

  const diffMs = outDate.getTime() - inDate.getTime()
  if (diffMs <= 0) return 0

  return diffMs / (1000 * 60 * 60 * 24)
}

/**
 * Determine the minimum nights requirement based on season.
 * Uses the global season date definition from src/data/seasons,
 * and the per-apartment minNights values from src/data/apartments.
 * Falls back to global defaults if not configured on the apartment.
 */
export function getSeasonalMinNights(checkIn: string, _apartment?: Apartment): number {
  const seasonId = getSeasonIdForDateString(checkIn)
  const defaults: Record<SeasonId, number> = {
    high: 5,
    low: 3,
  }

  if (_apartment && _apartment.minNights) {
    const value = _apartment.minNights[seasonId]
    if (typeof value === 'number') {
      return value
    }
  }

  return defaults[seasonId]
}

/**
 * Check if a stay meets the apartment's minimum nights requirement.
 * Uses seasonal rules (high/low season) that can later be customised per apartment.
 */
export function meetsMinimumNights(
  apartment: Apartment,
  checkIn: string,
  checkOut: string
): boolean {
  const min = getSeasonalMinNights(checkIn, apartment)
  const nights = getStayNights(checkIn, checkOut)
  if (nights === 0) return false
  return nights >= min
}

/**
 * Generates a mailto link for booking request
 * @param apartment The apartment to book
 * @param checkIn Check-in date (YYYY-MM-DD)
 * @param checkOut Check-out date (YYYY-MM-DD)
 * @param guests Number of guests (optional)
 * @param guestName Guest name (optional)
 * @param locale Language locale
 * @returns mailto URL string
 */
export function buildMailtoLink(
  apartment: Apartment,
  checkIn: string,
  checkOut: string,
  guests?: number,
  guestName?: string,
  locale: 'de' | 'en' = 'en'
): string {
  const email = 'info@stieregg.ch'
  const apartmentName = apartment.name[locale]
  
  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const subject = encodeURIComponent(`Booking request: ${apartmentName}`)
  
  const bodyLines = [
    `Apartment: ${apartmentName}`,
    '',
    `Check-in: ${formatDate(checkIn)}`,
    `Check-out: ${formatDate(checkOut)}`,
  ]

  if (guests) {
    bodyLines.push(`Guests: ${guests}`)
  }

  if (guestName) {
    bodyLines.push(`Name: ${guestName}`)
  } else {
    bodyLines.push('Name: ____')
  }

  bodyLines.push('')
  // Use a relative URL that can be made absolute by the email client or recipient
  // The full URL will be constructed from the current domain when the email is sent
  const apartmentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/apartments/${apartment.slug}`
    : `/apartments/${apartment.slug}`
  bodyLines.push(`Apartment page: ${apartmentUrl}`)

  const body = encodeURIComponent(bodyLines.join('\n'))

  return `mailto:${email}?subject=${subject}&body=${body}`
}

