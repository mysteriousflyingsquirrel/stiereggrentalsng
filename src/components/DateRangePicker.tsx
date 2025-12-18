'use client'

import { useState, useRef, useEffect } from 'react'
import { Locale } from '@/lib/locale'

type DateRangePickerProps = {
  checkIn: string
  checkOut: string
  onCheckInChange: (date: string) => void
  onCheckOutChange: (date: string) => void
  locale: Locale
  className?: string
}

export default function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  locale,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectionMode, setSelectionMode] = useState<'checkIn' | 'checkOut'>('checkIn')
  const pickerRef = useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // When the calendar closes with only a check-in selected (no check-out),
  // reset the check-in so there is no half-finished selection left.
  useEffect(() => {
    if (!isOpen && checkIn && !checkOut) {
      onCheckInChange('')
      setSelectionMode('checkIn')
    }
  }, [isOpen, checkIn, checkOut, onCheckInChange])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleDateClick = (date: Date) => {
    // Format date using local time components to avoid timezone issues
    const dateStr = formatDateToString(date)
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)

    // Can't select past dates
    if (dateObj < today) return

    if (selectionMode === 'checkIn') {
      onCheckInChange(dateStr)
      setSelectionMode('checkOut')
      // If check-out exists and is before new check-in, clear it
      if (checkOut && dateStr > checkOut) {
        onCheckOutChange('')
      }
    } else {
      // Selecting check-out
      if (dateStr <= checkIn) {
        // If selected date is before or equal to check-in, treat as new check-in
        onCheckInChange(dateStr)
        onCheckOutChange('')
        setSelectionMode('checkOut')
      } else {
        onCheckOutChange(dateStr)
        setSelectionMode('checkIn')
        setIsOpen(false) // Close after selecting both dates
      }
    }
  }

  const isDateInRange = (date: Date): boolean => {
    if (!checkIn || !checkOut) return false
    const dateStr = formatDateToString(date)
    return dateStr >= checkIn && dateStr <= checkOut
  }

  const isDateSelected = (date: Date, type: 'checkIn' | 'checkOut'): boolean => {
    const dateStr = formatDateToString(date)
    if (type === 'checkIn') return dateStr === checkIn
    return dateStr === checkOut
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const days = getDaysInMonth(selectedMonth)
  const currentMonth = selectedMonth.getMonth()

  const displayText = checkIn && checkOut
    ? `${formatDisplayDate(checkIn)} - ${formatDisplayDate(checkOut)}`
    : checkIn
    ? `${formatDisplayDate(checkIn)} - ...`
    : ''

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Input field */}
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

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 min-w-[320px]">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[locale][selectedMonth.getMonth()]} {selectedMonth.getFullYear()}
            </h3>
            <button
              onClick={() => changeMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames[locale].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth
              const isPast = day < today
              const isInRange = isDateInRange(day)
              const isCheckIn = isDateSelected(day, 'checkIn')
              const isCheckOut = isDateSelected(day, 'checkOut')
              const isDisabled = isPast || !isCurrentMonth

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  disabled={isDisabled}
                  className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-all
                    ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}
                    ${isInRange ? 'bg-accent/10' : ''}
                    ${isCheckIn || isCheckOut ? 'bg-accent text-white font-semibold' : ''}
                    ${!isDisabled && isCurrentMonth ? 'hover:bg-accent/20' : ''}
                  `}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          {/* Help text */}
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

