'use client'

import { useEffect, useState } from 'react'
import { BookedRange } from '@/lib/availability'

type AvailabilityCalendarProps = {
  slug: string
  months?: number
  className?: string
  locale?: 'de' | 'en'
  showMonthSelector?: boolean
}

export default function AvailabilityCalendar({
  slug,
  months = 2,
  className = '',
  locale = 'de',
  showMonthSelector = false,
}: AvailabilityCalendarProps) {
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())

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

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return bookedRanges.some((range) => {
      const start = new Date(range.start)
      const end = new Date(range.end)
      const checkDate = new Date(dateStr)
      return checkDate >= start && checkDate <= end
    })
  }

  const getMonthsToShow = () => {
    if (showMonthSelector) {
      // Show only the selected month (if within valid range)
      const month = new Date(selectedMonth)
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

    // Show multiple months, but limit to valid range (current month + 2 years)
    const monthsArray = []
    const today = new Date()
    today.setDate(1) // Start of month

    // Calculate maximum months to show (up to 24 months from today)
    const maxMonths = Math.min(months, 24)
    const monthsFromToday = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const actualMonths = Math.min(maxMonths, monthsFromToday + 1)

    for (let i = 0; i < actualMonths; i++) {
      const month = new Date(today)
      month.setMonth(today.getMonth() + i)
      
      // Only add if within valid range
      if (isDateInValidRange(month)) {
        monthsArray.push(month)
      }
    }

    return monthsArray
  }

  const changeMonth = (direction: 'prev' | 'next') => {
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
    const [year, month] = e.target.value.split('-').map(Number)
    const newDate = new Date(year, month - 1, 1)
    
    // Ensure selected date is within valid range
    if (isDateInValidRange(newDate)) {
      setSelectedMonth(newDate)
    }
  }

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
              {Array.from({ length: 3 }, (_, i) => {
                const year = new Date().getFullYear() + i
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              })}
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
                {days.map((day, dayIndex) => {
                  const isCurrentMonth = day.getMonth() === currentMonth
                  const isBooked = isDateBooked(day)
                  const isToday =
                    day.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={dayIndex}
                      className={`
                        aspect-square flex items-center justify-center text-xs rounded
                        ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                        ${isBooked ? 'bg-red-100 text-red-600 font-medium' : ''}
                        ${!isBooked && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                        ${isToday && !isBooked ? 'ring-2 ring-accent' : ''}
                      `}
                    >
                      {day.getDate()}
                    </div>
                  )
                })}
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

