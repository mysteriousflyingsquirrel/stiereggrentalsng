import { BookedRange } from './availability'

export function getBookingClosedFrom(): string {
  const now = new Date()
  const closed = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
  const year = closed.getFullYear()
  const month = String(closed.getMonth() + 1).padStart(2, '0')
  const day = String(closed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isDateClosedForBooking(dateStr: string): boolean {
  return dateStr >= getBookingClosedFrom()
}

export function getBookingClosureRange(): BookedRange {
  return { start: getBookingClosedFrom(), end: '2099-12-31' }
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
