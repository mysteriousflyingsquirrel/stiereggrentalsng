'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookedRange } from '@/lib/availability'
import { isApartmentAvailable } from '@/lib/booking'
import { getLocaleFromSearchParams } from '@/lib/locale'

type AvailabilityCalendarProps = {
  slug?: string | null // Optional: if not provided, no iCal fetching
  months?: number
  className?: string
  locale?: 'de' | 'en'
  showMonthSelector?: boolean
  checkIn?: string | null
  checkOut?: string | null
  onDateSelect?: (checkIn: string | null, checkOut: string | null) => void
  dropdown?: boolean // If true, render as dropdown (like DateRangePicker)
  onCheckInChange?: (date: string) => void // For dropdown mode
  onCheckOutChange?: (date: string) => void // For dropdown mode
}

export default function AvailabilityCalendar({
  slug = null,
  months = 2,
  className = '',
  locale = 'de',
  showMonthSelector = false,
  checkIn = null,
  checkOut = null,
  onDateSelect,
  dropdown = false,
  onCheckInChange,
  onCheckOutChange,
}: AvailabilityCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [loading, setLoading] = useState(!!slug) // Only show loading if we're fetching iCal
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [hasManuallyChangedMonth, setHasManuallyChangedMonth] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState<'checkIn' | 'checkOut'>('checkIn')
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
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

  // Fetch iCal only if slug is provided
  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setBookedRanges([])
      return
    }

    let cancelled = false

    async function fetchAvailability() {
      try {
        const response = await fetch(`/api/availability?slug=${slug}`)
        if (cancelled) return
        if (response.ok) {
          const data = await response.json()
          if (!cancelled) {
            setBookedRanges(data.bookedRanges || [])
          }
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    setLoading(true)
    fetchAvailability()

    return () => {
      cancelled = true
    }
  }, [slug])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdown || !isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        // If only check-in is selected, clear it when closing the dropdown
        if (checkIn && !checkOut && onCheckInChange) {
          onCheckInChange('')
          setSelectionMode('checkIn')
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdown, isOpen, checkIn, checkOut, onCheckInChange])

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

    // Dropdown mode: use selectionMode
    if (dropdown) {
      if (selectionMode === 'checkIn') {
        if (onCheckInChange) onCheckInChange(dateStr)
        setSelectionMode('checkOut')
        // If check-out exists and is before new check-in, clear it
        if (checkOut && dateStr > checkOut && onCheckOutChange) {
          onCheckOutChange('')
        }
      } else {
        // Selecting check-out
        if (dateStr <= (checkIn || '')) {
          // If selected date is before or equal to check-in, treat as new check-in
          if (onCheckInChange) onCheckInChange(dateStr)
          if (onCheckOutChange) onCheckOutChange('')
          setSelectionMode('checkOut')
        } else {
          if (onCheckOutChange) onCheckOutChange(dateStr)
          setSelectionMode('checkIn')
          setIsOpen(false) // Close after selecting both dates
        }
      }
      return
    }

    // Full calendar mode: original logic
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

  // Get months to show: 2 for desktop, 1 for mobile (when not dropdown)
  const getMonthsToShow = () => {
    // Determine starting month
    let startMonth: Date = selectedMonth
    if (checkIn && checkOut && !loading && !hasManuallyChangedMonth && !dropdown) {
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

    const monthsArray = []
    const baseMonth = new Date(startMonth)
    baseMonth.setDate(1)
    baseMonth.setHours(0, 0, 0, 0)

    // Always show exactly 2 months for desktop, 1 for mobile (handled via CSS responsive grid)
    // Dropdown mode can show multiple months in a scrollable area
    let monthsToShow = 2
    if (dropdown) {
      monthsToShow = 2 // Dropdown shows 2 months stacked
    } else {
      // Full calendar: always 2 months (CSS handles responsive: 1 on mobile, 2 on desktop)
      monthsToShow = 2
    }

    for (let i = 0; i < monthsToShow; i++) {
      const month = new Date(baseMonth)
      month.setMonth(baseMonth.getMonth() + i)
      
      if (isDateInValidRange(month)) {
        monthsArray.push(month)
      } else {
        break
      }
    }

    return monthsArray
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setHasManuallyChangedMonth(true)
    
    // Always move by 2 months (month pair) - CSS handles showing 1 or 2 months responsively
    const monthStep = 2

    setSelectedMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - monthStep)
      } else {
        newDate.setMonth(newDate.getMonth() + monthStep)
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

  // Swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while swiping horizontally
    if (touchStart) {
      const touch = e.touches[0]
      const deltaX = touch.clientX - touchStart.x
      const deltaY = touch.clientY - touchStart.y
      
      // Only prevent default if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    const minSwipeDistance = 50

    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right = previous month
        if (selectedMonth > startDate) {
          changeMonth('prev')
        }
      } else {
        // Swipe left = next month
        const lastMonth = new Date(selectedMonth)
        lastMonth.setMonth(lastMonth.getMonth() + 1)
        if (lastMonth < endDate) {
          changeMonth('next')
        }
      }
    }

    setTouchStart(null)
  }

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setHasManuallyChangedMonth(true)
    const [year, month] = e.target.value.split('-').map(Number)
    const newDate = new Date(year, month - 1, 1)
    
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

    // Remove trailing weeks that belong entirely to the next month
    for (let i = days.length - 7; i >= 0; i -= 7) {
      const week = days.slice(i, i + 7)
      const hasCurrentMonthDay = week.some((d) => d.getMonth() === month)
      if (hasCurrentMonthDay) {
        return days.slice(0, i + 7)
      }
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

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Render a single month calendar
  const renderMonth = (month: Date, monthIndex: number, showPrevButton: boolean = false, showNextButton: boolean = false) => {
    const days = getDaysInMonth(month)
    const currentMonth = month.getMonth()
    
    // Calculate if we can navigate (available in both modes)
    const canGoPrevLocal = selectedMonth > startDate
    const canGoNextLocal = (() => {
      const lastMonth = new Date(selectedMonth)
      lastMonth.setMonth(lastMonth.getMonth() + 1)
      return lastMonth < endDate
    })()

    return (
      <div key={monthIndex} className="bg-white rounded-xl p-4">
        <div className="mb-4 flex items-center justify-between min-h-[2.5rem]">
          {showPrevButton ? (
            <button
              onClick={() => changeMonth('prev')}
              disabled={!canGoPrevLocal}
              className={`p-2 rounded-lg transition-colors ${
                !canGoPrevLocal
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
              aria-label={locale === 'de' ? 'Vorheriger Monat' : 'Previous month'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          ) : (
            <div className="w-9"></div> // Spacer to keep title centered
          )}
          <h3 className="text-center font-semibold text-gray-900 text-lg flex-1">
            {monthNames[locale][month.getMonth()]} {month.getFullYear()}
          </h3>
          {showNextButton ? (
            <button
              onClick={() => changeMonth('next')}
              disabled={!canGoNextLocal}
              className={`p-2 rounded-lg transition-colors ${
                !canGoNextLocal
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100'
              }`}
              aria-label={locale === 'de' ? 'Nächster Monat' : 'Next month'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          ) : (
            <div className="w-9"></div> // Spacer to keep title centered
          )}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames[locale].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, dayIndex) => {
            const isCurrentMonth = day.getMonth() === currentMonth
            const isBooked = isDateBooked(day)
            const isToday = day.toDateString() === new Date().toDateString()
            
            const year = day.getFullYear()
            const month = String(day.getMonth() + 1).padStart(2, '0')
            const date = String(day.getDate()).padStart(2, '0')
            const dayStr = `${year}-${month}-${date}`
            
            let isSelectedDate = false
            let isCheckIn = false
            let isCheckOut = false
            let isHoverRange = false
            
            if (checkIn && checkOut) {
              isCheckIn = dayStr === checkIn
              isCheckOut = dayStr === checkOut
              if (dayStr >= checkIn && dayStr <= checkOut) {
                isSelectedDate = true
              }
            } else if (checkIn && !checkOut && hoveredDate) {
              isCheckIn = dayStr === checkIn
              const hoverDate = hoveredDate
              const startDate = checkIn < hoverDate ? checkIn : hoverDate
              const endDate = checkIn > hoverDate ? checkIn : hoverDate
              if (dayStr >= startDate && dayStr <= endDate && dayStr !== checkIn) {
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
                  ${isClickable && !isBooked && !isCheckIn && !isCheckOut && !isSelectedDate && !isHoverRange ? 'hover:bg-gray-100 cursor-pointer' : ''}
                  ${isSelectedDate && !isBooked ? 'bg-blue-50 text-blue-700' : ''}
                  ${isHoverRange && !isBooked ? 'bg-blue-100 text-blue-800' : ''}
                  ${isCheckIn && !isBooked && isCurrentMonth ? 'bg-blue-500 text-white font-semibold' : ''}
                  ${isCheckOut && !isBooked && isCurrentMonth ? 'bg-blue-500 text-white font-semibold' : ''}
                  ${isToday && !isBooked && !isSelectedDate && !isHoverRange && !isCheckIn && !isCheckOut ? 'ring-2 ring-blue-400' : ''}
                `}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-48 ${className}`}>
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  const monthsToShow = getMonthsToShow()

  // Dropdown mode: render as button with dropdown calendar
  if (dropdown) {
    const displayText = checkIn && checkOut
      ? `${formatDisplayDate(checkIn)} - ${formatDisplayDate(checkOut)}`
      : checkIn
      ? `${formatDisplayDate(checkIn)} - ...`
      : ''

    return (
      <div className={`relative ${className}`} ref={calendarRef}>
        <div>
          <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1.5">
            {locale === 'de' ? 'Daten' : 'Dates'}
          </label>
          <button
            type="button"
            id="dateRange"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full h-[42px] px-4 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-accent focus:border-transparent hover:border-gray-400 transition-colors flex items-center ${
              !displayText ? 'text-gray-400' : 'text-gray-900'
            }`}
          >
            {displayText || (locale === 'de' ? 'Check-in Check-out' : 'Check-in Check-out')}
          </button>
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 min-w-[320px] md:min-w-[640px]">
            {/* Calendar months - 2 months side-by-side on desktop, 1 on mobile */}
            <div 
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {(() => {
                  const canGoPrevDropdown = selectedMonth > startDate
                  const canGoNextDropdown = (() => {
                    const lastMonth = new Date(selectedMonth)
                    lastMonth.setMonth(lastMonth.getMonth() + 1)
                    return lastMonth < endDate
                  })()
                  return monthsToShow.map((month, monthIndex) => {
                    const isFirstMonth = monthIndex === 0
                    const isLastMonth = monthIndex === monthsToShow.length - 1
                    const showPrev = isFirstMonth && canGoPrevDropdown
                    const showNext = isLastMonth && canGoNextDropdown
                    return renderMonth(month, monthIndex, showPrev, showNext)
                  })
                })()}
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              {selectionMode === 'checkIn'
                ? locale === 'de'
                  ? 'Wählen Sie das Check-in-Datum'
                  : 'Select check-in date'
                : locale === 'de'
                ? 'Wählen Sie das Check-out-Datum'
                : 'Select check-out date'}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Full calendar mode: new design with 2 months side-by-side on desktop
  const canGoPrev = selectedMonth > startDate
  const canGoNext = (() => {
    const lastMonth = new Date(selectedMonth)
    const step = showMonthSelector ? 1 : 2
    lastMonth.setMonth(lastMonth.getMonth() + step - 1)
    return lastMonth < endDate
  })()

  return (
    <div className={className}>
      {/* Single container for all calendar elements */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4">
        {/* Calendar months - 2 months side-by-side on desktop, 1 on mobile */}
        <div 
          className="relative overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {monthsToShow.map((month, monthIndex) => {
              const isFirstMonth = monthIndex === 0
              const isLastMonth = monthIndex === monthsToShow.length - 1
              // On mobile (single month), show both buttons. On desktop, show prev on first, next on last
              const showPrev = isFirstMonth && canGoPrev
              const showNext = isLastMonth && canGoNext
              return renderMonth(month, monthIndex, showPrev, showNext)
            })}
          </div>
        </div>

        {/* Legend */}
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
    </div>
  )
}
