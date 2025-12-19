'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'
import AvailabilityCalendar from './AvailabilityCalendar'

type AvailabilityBarProps = {
  className?: string
}

export default function AvailabilityBar({ className = '' }: AvailabilityBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  // Get initial values from URL params
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') || '')
  const [guests, setGuests] = useState(() => {
    const guestsParam = searchParams.get('guests')
    return guestsParam ? parseInt(guestsParam, 10) : 1
  })
  const [onlyAvailable, setOnlyAvailable] = useState(searchParams.get('onlyAvailable') === '1')

  // Update URL params when values change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (checkIn) {
      params.set('checkIn', checkIn)
    } else {
      params.delete('checkIn')
    }

    if (checkOut) {
      params.set('checkOut', checkOut)
    } else {
      params.delete('checkOut')
    }

    if (guests && guests !== 1) {
      params.set('guests', guests.toString())
    } else {
      params.delete('guests')
    }

    if (onlyAvailable) {
      params.set('onlyAvailable', '1')
    } else {
      params.delete('onlyAvailable')
    }

    // Preserve lang param
    params.set('lang', locale)

    router.replace(`?${params.toString()}`, { scroll: false })
  }, [checkIn, checkOut, guests, onlyAvailable, locale, router, searchParams])

  const handleGuestsIncrement = () => {
    setGuests((prev) => Math.min(prev + 1, 20)) // Max 20 guests
  }

  const handleGuestsDecrement = () => {
    setGuests((prev) => Math.max(prev - 1, 1)) // Min 1 guest
  }

  const handleClear = () => {
    setCheckIn('')
    setCheckOut('')
    setGuests(1)
    setOnlyAvailable(false)
  }

  const hasDates = checkIn && checkOut
  const hasFilters = checkIn || checkOut || guests !== 1 || onlyAvailable

  return (
    <div className={`bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        {/* Date range picker */}
        <div className="flex-1 min-w-0">
          <AvailabilityCalendar
            slug={null}
            months={2}
            locale={locale}
            checkIn={checkIn || null}
            checkOut={checkOut || null}
            dropdown={true}
            onCheckInChange={setCheckIn}
            onCheckOutChange={setCheckOut}
          />
        </div>

        {/* Guests counter */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {locale === 'de' ? 'Gäste' : 'Guests'}
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg h-[42px] w-full lg:w-auto">
            <button
              type="button"
              onClick={handleGuestsDecrement}
              disabled={guests <= 1}
              className="h-full w-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg flex items-center justify-center touch-manipulation"
              aria-label={locale === 'de' ? 'Gäste verringern' : 'Decrease guests'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>
            <span className="h-full flex-1 px-4 min-w-[3rem] text-center font-medium text-gray-900 border-x border-gray-300 flex items-center justify-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={handleGuestsIncrement}
              disabled={guests >= 20}
              className="h-full w-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg flex items-center justify-center touch-manipulation"
              aria-label={locale === 'de' ? 'Gäste erhöhen' : 'Increase guests'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toggle and Clear */}
        <div className="flex items-center justify-between w-full lg:w-auto flex-shrink-0">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="onlyAvailable"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              disabled={!hasDates}
              className="w-5 h-5 text-accent border-gray-300 rounded focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            />
            <label
              htmlFor="onlyAvailable"
              className={`ml-2 text-sm font-medium ${
                hasDates ? 'text-gray-700' : 'text-gray-400'
              }`}
            >
              {locale === 'de' ? 'Nur verfügbare' : 'Show only available'}
            </label>
          </div>

          <button
            onClick={handleClear}
            disabled={!hasFilters}
            className={`ml-4 h-[42px] px-4 text-sm font-medium rounded-lg transition-colors whitespace-nowrap touch-manipulation ${
              hasFilters
                ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 cursor-pointer'
                : 'text-gray-400 cursor-not-allowed opacity-60'
            }`}
            aria-label={locale === 'de' ? 'Zurücksetzen' : 'Clear'}
          >
            {locale === 'de' ? 'Zurücksetzen' : 'Clear'}
          </button>
        </div>
      </div>
    </div>
  )
}

