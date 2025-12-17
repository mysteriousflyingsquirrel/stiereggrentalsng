'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookedRange } from '@/lib/availability'
import { isApartmentAvailable } from '@/lib/booking'
import { getLocaleFromSearchParams } from '@/lib/locale'

type AvailabilityCalendarProps = {
  slug: string
  months?: number
  className?: string
  locale?: 'de' | 'en'
  showMonthSelector?: boolean
  checkIn?: string | null
  checkOut?: string | null
  onDateSelect?: (checkIn: string | null, checkOut: string | null) => void
}

export default function AvailabilityCalendar({
  slug,
  months = 2,
  className = '',
  locale = 'de',
  showMonthSelector = false,
  checkIn = null,
  checkOut = null,
  onDateSelect,
}: AvailabilityCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [hasManuallyChangedMonth, setHasManuallyChangedMonth] = useState(false)
  const currentLocale = locale || getLocaleFromSearchParams(searchParams)

  // Calculate valid date range: current month to 2 years ahead (24 months)
  const getValidDateRange = () => {
    const startDate = new Date()
    startDate.setDate(1) // Start of current month
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 24) // 2 years ahead
    endDate.setDate(1) // Start of that month
    endDate.setHours(0, 0, 0, 0)

    return { startDate, endDate }
  }

  const { startDate, endDate } = getValidDateRange()

  const isDateInValidRange = (date: Date): boolean => {
    const checkDate = new Date(date)
    checkDate.setDate(1)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate >= startDate && checkDate <= endDate
  }

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const response = await fetch(`/api/availability?slug=${slug}`)
        if (response.ok) {
          const data = await response.json()
          setBookedRanges(data.bookedRanges || [])
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [slug])

  // Jump to checkIn month if dates are selected AND apartment is available (only on initial load, not when user manually changes month)
  useEffect(() => {
    if (checkIn && checkOut && !loading && !hasManuallyChangedMonth) {
      const available = isApartmentAvailable(bookedRanges, checkIn, checkOut)
      if (available) {
        const checkInDate = new Date(checkIn)
        const checkInMonth = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1)
        checkInMonth.setHours(0, 0, 0, 0)
        
        // Only jump if the month is within valid range
        if (isDateInValidRange(checkInMonth)) {
          setSelectedMonth(checkInMonth)
        }
      } else {
        // If not available, reset to current month
        const today = new Date()
        today.setDate(1)
        today.setHours(0, 0, 0, 0)
        setSelectedMonth(today)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut, bookedRanges, loading, hasManuallyChangedMonth])

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const isDateBooked = (date: Date): boolean => {
    const dateStr = formatDateToString(date)
    // Compare as strings (YYYY-MM-DD format) to avoid timezone issues
    return bookedRanges.some((range) => {
      return dateStr >= range.start && dateStr <= range.end
    })
  }

  const handleDateClick = (date: Date) => {
    if (isDateBooked(date)) return // Don't allow selection of booked dates
    
    const dateStr = formatDateToString(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDate = new Date(date)
    dayDate.setHours(0, 0, 0, 0)
    
    // Don't allow selection of past dates
    if (dayDate < today) return

    let newCheckIn: string | null = checkIn || null
    let newCheckOut: string | null = checkOut || null

    if (!checkIn || (checkIn && dateStr < checkIn) || (checkIn && checkOut)) {
      // If no check-in, or new date is before current check-in, or both are set, start new selection
      newCheckIn = dateStr
      newCheckOut = null
    } else if (dateStr > checkIn) {
      // If check-in is set and new date is after check-in, set check-out
      newCheckOut = dateStr
    }

    // Update URL params
    if (onDateSelect) {
      onDateSelect(newCheckIn, newCheckOut)
    } else {
      // Default behavior: update URL params
      const params = new URLSearchParams(searchParams.toString())
      
      if (newCheckIn) {
        params.set('checkIn', newCheckIn)
      } else {
        params.delete('checkIn')
      }

      if (newCheckOut) {
        params.set('checkOut', newCheckOut)
      } else {
        params.delete('checkOut')
      }

      // Preserve lang param
      params.set('lang', currentLocale)

      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  const getMonthsToShow = () => {
    // Determine starting month - use checkIn month if dates are selected, apartment is available, and valid, otherwise use selectedMonth
    let startMonth: Date = selectedMonth
    if (checkIn && checkOut && !loading) {
      const available = isApartmentAvailable(bookedRanges, checkIn, checkOut)
      if (available) {
        const checkInDate = new Date(checkIn)
        const checkInMonth = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), 1)
        checkInMonth.setHours(0, 0, 0, 0)
        if (isDateInValidRange(checkInMonth)) {
          startMonth = checkInMonth
        }
      }
    }

    if (showMonthSelector) {
      // Show only the selected month (if within valid range)
      const month = new Date(startMonth)
      month.setDate(1)
      
      // Ensure selected month is within valid range
      if (!isDateInValidRange(month)) {
        // If outside range, use current month
        const currentMonth = new Date()
        currentMonth.setDate(1)
        return [currentMonth]
      }
      
      return [month]
    }

    // Show multiple months, but limit to valid range (starting from startMonth)
    const monthsArray = []
    const baseMonth = new Date(startMonth)
    baseMonth.setDate(1) // Start of month
    baseMonth.setHours(0, 0, 0, 0)

    // Calculate maximum months to show (up to 24 months)
    const maxMonths = Math.min(months, 24)

    for (let i = 0; i < maxMonths; i++) {
      const month = new Date(baseMonth)
      month.setMonth(baseMonth.getMonth() + i)
      
      // Only add if within valid range
      if (isDateInValidRange(month)) {
        monthsArray.push(month)
      } else {
        // If we've exceeded the valid range, stop
        break
      }
    }

    return monthsArray
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setHasManuallyChangedMonth(true)
    setSelectedMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      newDate.setDate(1)
      
      // Clamp to valid range
      if (newDate < startDate) {
        return new Date(startDate)
      }
      if (newDate > endDate) {
        return new Date(endDate)
      }
      
      return newDate
    })
  }

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasManuallyChangedMonth(true)
    const [year, month] = e.target.value.split('-').map(Number)
    const newDate = new Date(year, month - 1, 1)
    
    // Ensure selected date is within valid range
    if (isDateInValidRange(newDate)) {
      setSelectedMonth(newDate)
    }
  }

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasManuallyChangedMonth(true)
    const year = parseInt(e.target.value)
    setSelectedMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setFullYear(year)
      newDate.setDate(1)
      
      // Clamp to valid range
      if (newDate < startDate) {
        return new Date(startDate)
      }
      if (newDate > endDate) {
        return new Date(endDate)
      }
      
      return newDate
    })
  }

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    // Add days from previous month to fill first week
    const startDay = firstDay.getDay()
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDay)

    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }

    return days
  }

  const monthNames = {
    de: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    en: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
  }

  const dayNames = {
    de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const monthsToShow = getMonthsToShow()

  return (
    <div className={className}>
      {showMonthSelector && (
        <div className="mb-4 flex items-center justify-between bg-white rounded-xl p-3 shadow-sm">
          <button
            onClick={() => changeMonth('prev')}
            disabled={selectedMonth <= startDate}
            className={`p-2 rounded-lg transition-colors ${
              selectedMonth <= startDate
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
            aria-label={locale === 'de' ? 'Vorheriger Monat' : 'Previous month'}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={handleMonthSelect}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
            >
              {monthNames[locale].map((name, index) => {
                const checkDate = new Date(selectedMonth.getFullYear(), index, 1)
                const isValid = isDateInValidRange(checkDate)
                if (!isValid) return null
                return (
                  <option
                    key={index}
                    value={`${selectedMonth.getFullYear()}-${String(index + 1).padStart(2, '0')}`}
                  >
                    {name}
                  </option>
                )
              })}
            </select>
            <select
              value={selectedMonth.getFullYear()}
              onChange={handleYearSelect}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent cursor-pointer"
            >
              {(() => {
                const currentYear = new Date().getFullYear()
                const endYear = endDate.getFullYear()
                const years = []
                for (let year = currentYear; year <= endYear; year++) {
                  years.push(year)
                }
                return years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              })()}
            </select>
          </div>

          <button
            onClick={() => changeMonth('next')}
            disabled={selectedMonth >= endDate}
            className={`p-2 rounded-lg transition-colors ${
              selectedMonth >= endDate
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100'
            }`}
            aria-label={locale === 'de' ? 'Nächster Monat' : 'Next month'}
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      )}

      <div className={`grid gap-6 ${showMonthSelector ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {monthsToShow.map((month, monthIndex) => {
          const days = getDaysInMonth(month)
          const currentMonth = month.getMonth()

          return (
            <div key={monthIndex} className="bg-white rounded-xl p-4 shadow-sm">
              {!showMonthSelector && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {monthNames[locale][month.getMonth()]} {month.getFullYear()}
                </h3>
              )}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames[locale].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  // Check availability once for the selected dates (if any)
                  const isSelectedRangeAvailable = checkIn && checkOut 
                    ? isApartmentAvailable(bookedRanges, checkIn, checkOut)
                    : false
                  
                  return days.map((day, dayIndex) => {
                    const isCurrentMonth = day.getMonth() === currentMonth
                    const isBooked = isDateBooked(day)
                    const isToday =
                      day.toDateString() === new Date().toDateString()
                    
                    // Format day as YYYY-MM-DD for comparison
                    const year = day.getFullYear()
                    const month = String(day.getMonth() + 1).padStart(2, '0')
                    const date = String(day.getDate()).padStart(2, '0')
                    const dayStr = `${year}-${month}-${date}`
                    
                    // Check if this day is within the selected date range
                    let isSelectedDate = false
                    let isCheckIn = false
                    let isCheckOut = false
                    let isHoverRange = false
                    
                    if (checkIn && checkOut) {
                      // Highlight dates if available, otherwise still show them as selected but maybe with different styling
                      isCheckIn = dayStr === checkIn
                      isCheckOut = dayStr === checkOut
                      // Highlight dates between checkIn and checkOut (inclusive)
                      if (dayStr >= checkIn && dayStr <= checkOut && isCurrentMonth) {
                        isSelectedDate = true
                      }
                    } else if (checkIn && !checkOut && hoveredDate) {
                    // Show hover preview when check-in is selected but check-out is not
                    isCheckIn = dayStr === checkIn
                    const hoverDate = hoveredDate
                    const startDate = checkIn < hoverDate ? checkIn : hoverDate
                    const endDate = checkIn > hoverDate ? checkIn : hoverDate
                    if (dayStr >= startDate && dayStr <= endDate && isCurrentMonth && dayStr !== checkIn) {
                      isHoverRange = true
                    }
                  } else if (checkIn && !checkOut) {
                    isCheckIn = dayStr === checkIn
                  }

                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const dayDate = new Date(day)
                  dayDate.setHours(0, 0, 0, 0)
                  const isPast = dayDate < today
                  const isClickable = isCurrentMonth && !isBooked && !isPast

                  return (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => isClickable && handleDateClick(day)}
                      onMouseEnter={() => isClickable && checkIn && !checkOut && setHoveredDate(dayStr)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={!isClickable}
                      className={`
                        aspect-square flex items-center justify-center text-xs rounded transition-colors
                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${isBooked ? 'bg-red-100 text-red-600 font-medium cursor-not-allowed' : ''}
                        ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                        ${isClickable && !checkIn ? 'hover:bg-gray-100 cursor-pointer' : ''}
                        ${isToday && !isBooked && !isSelectedDate && !isHoverRange ? 'ring-2 ring-accent' : ''}
                        ${isSelectedDate && !isBooked && isCurrentMonth ? (isSelectedRangeAvailable ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700') : ''}
                        ${isHoverRange && !isBooked && isCurrentMonth ? 'bg-blue-100 text-blue-800' : ''}
                        ${isCheckIn && !isBooked && isCurrentMonth ? (isSelectedRangeAvailable ? 'bg-blue-200 text-blue-900 font-semibold ring-2 ring-blue-400' : 'bg-yellow-200 text-yellow-900 font-semibold ring-2 ring-yellow-400') : ''}
                        ${isCheckOut && !isBooked && isCurrentMonth ? (isSelectedRangeAvailable ? 'bg-blue-200 text-blue-900 font-semibold ring-2 ring-blue-400' : 'bg-yellow-200 text-yellow-900 font-semibold ring-2 ring-yellow-400') : ''}
                      `}
                    >
                      {day.getDate()}
                    </button>
                  )
                  })
                })()}
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-200"></div>
          <span>{locale === 'de' ? 'Verfügbar' : 'Available'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100"></div>
          <span>{locale === 'de' ? 'Gebucht' : 'Booked'}</span>
        </div>
      </div>
    </div>
  )
}

