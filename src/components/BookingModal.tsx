'use client'

import { useState, useEffect } from 'react'
import { Locale } from '@/lib/locale'
import { Apartment } from '@/data/apartments'
import { HiXMark } from 'react-icons/hi2'

type BookingModalProps = {
  isOpen: boolean
  onClose: () => void
  apartment: Apartment
  checkIn: string
  checkOut: string
  locale: Locale
  onConfirm: (name: string, guests: number) => void
  initialGuests?: number
}

export default function BookingModal({
  isOpen,
  onClose,
  apartment,
  checkIn,
  checkOut,
  locale,
  onConfirm,
  initialGuests,
}: BookingModalProps) {
  const [name, setName] = useState('')
  const [guests, setGuests] = useState<number>(initialGuests || 1)

  // Reset name and guests when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setGuests(initialGuests || 1)
    } else if (initialGuests) {
      setGuests(initialGuests)
    }
  }, [isOpen, initialGuests])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      locale === 'de' ? 'de-CH' : 'en-GB',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onConfirm(name.trim(), guests)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[1001] flex items-start justify-center p-4 pt-20 md:pt-4 md:items-center overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[calc(100vh-5rem)] md:max-h-[90vh] overflow-y-auto my-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {locale === 'de' ? 'Buchungsanfrage' : 'Booking Request'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={locale === 'de' ? 'Schließen' : 'Close'}
          >
            <HiXMark className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Selected Apartment */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {locale === 'de' ? 'Ausgewähltes Apartment:' : 'Selected apartment:'}
            </h3>
            <div className="flex items-center gap-2 p-2 bg-accent/5 border border-accent/20 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-lg flex items-center justify-center font-semibold">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">
                  {apartment.name[locale]}
                </div>
              </div>
            </div>
          </div>

          {/* Selected Dates */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {locale === 'de' ? 'Ausgewählte Daten:' : 'Selected dates:'}
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 flex-1 p-2 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-lg flex items-center justify-center font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">
                    {locale === 'de' ? 'Anreise' : 'Check-in'}
                  </div>
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {formatDate(checkIn)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 p-2 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-lg flex items-center justify-center font-semibold">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">
                    {locale === 'de' ? 'Abreise' : 'Check-out'}
                  </div>
                  <div className="font-semibold text-gray-900 text-sm truncate">
                    {formatDate(checkOut)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              {locale === 'de' ? 'Ihr Name' : 'Your Name'} *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                locale === 'de'
                  ? 'Bitte geben Sie Ihren Namen ein'
                  : 'Please enter your name'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
              required
              autoFocus
            />
          </div>

          {/* Guests Input */}
          <div className="mb-6">
            <label
              htmlFor="guests"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              {locale === 'de' ? 'Anzahl Gäste' : 'Number of Guests'} *
            </label>
            
            {/* Mobile: Button interface */}
            <div className="md:hidden">
              <div className="flex items-center border border-gray-300 rounded-lg h-[42px]">
                <button
                  type="button"
                  onClick={() => setGuests(Math.max(1, guests - 1))}
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
                  onClick={() => setGuests(Math.min(apartment.facts.guests, guests + 1))}
                  disabled={guests >= apartment.facts.guests}
                  className="h-full w-12 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-r-lg flex items-center justify-center touch-manipulation"
                  aria-label={locale === 'de' ? 'Gäste erhöhen' : 'Increase guests'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Desktop: Number input */}
            <div className="hidden md:block">
              <input
                id="guests"
                type="number"
                min={1}
                max={apartment.facts.guests}
                value={guests}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value) && value >= 1 && value <= apartment.facts.guests) {
                    setGuests(value)
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                required
              />
            </div>
            
            <p className="mt-1 text-xs text-gray-500">
              {locale === 'de'
                ? `Maximal ${apartment.facts.guests} ${apartment.facts.guests === 1 ? 'Gast' : 'Gäste'}`
                : `Maximum ${apartment.facts.guests} ${apartment.facts.guests === 1 ? 'guest' : 'guests'}`}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              {locale === 'de' ? 'Abbrechen' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-3 bg-gold text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-dark hover:shadow-lg"
            >
              {locale === 'de' ? 'Weiter' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

