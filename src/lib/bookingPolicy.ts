import { BookedRange } from './availability'

export const BOOKING_CLOSED_FROM = '2026-12-19' as const

export function isDateClosedForBooking(dateStr: string): boolean {
  return dateStr >= BOOKING_CLOSED_FROM
}

export function getBookingClosureRange(): BookedRange {
  return { start: BOOKING_CLOSED_FROM, end: '2099-12-31' }
}

export function isStayInBookingClosure(checkIn: string, checkOut: string): boolean {
  if (!checkIn || !checkOut) return false

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  if (checkInDate >= checkOutDate) return false

  const closure = getBookingClosureRange()
  const closureStart = new Date(closure.start)
  const closureEnd = new Date(closure.end)

  return checkInDate <= closureEnd && checkOutDate >= closureStart
}
