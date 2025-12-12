'use client'

import { useEffect, useState } from 'react'
import { BookedRange } from '@/lib/availability'

type AvailabilityCalendarProps = {
  slug: string
  months?: number
  className?: string
  locale?: 'de' | 'en'
}

export default function AvailabilityCalendar({
  slug,
  months = 2,
  className = '',
  locale = 'de',
}: AvailabilityCalendarProps) {
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [loading, setLoading] = useState(true)

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
    const monthsArray = []
    const today = new Date()
    today.setDate(1) // Start of month

    for (let i = 0; i < months; i++) {
      const month = new Date(today)
      month.setMonth(today.getMonth() + i)
      monthsArray.push(month)
    }

    return monthsArray
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

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {getMonthsToShow().map((month, monthIndex) => {
          const days = getDaysInMonth(month)
          const currentMonth = month.getMonth()

          return (
            <div key={monthIndex} className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {monthNames[locale][month.getMonth()]} {month.getFullYear()}
              </h3>
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

