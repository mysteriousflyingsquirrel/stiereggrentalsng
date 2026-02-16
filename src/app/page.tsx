'use client'

import { useState, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useApartments } from '@/hooks/useApartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'
import ApartmentCard from '@/components/ApartmentCard'
import MapView from '@/components/MapView'
import AvailabilityBar from '@/components/AvailabilityBar'
import Image from 'next/image'
import { HiOutlineViewGrid, HiOutlineMap } from 'react-icons/hi'
import { useApartmentAvailability } from '@/hooks/useApartmentAvailability'
import { isApartmentAvailable } from '@/lib/booking'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = getLocaleFromSearchParams(searchParams)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(() => {
    return searchParams.get('view') === 'map' ? 'map' : 'grid'
  })

  // Get booking params from URL
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  const guestsParam = searchParams.get('guests')
  const guests = guestsParam || '1' // Default to 1 if not specified
  const onlyAvailable = searchParams.get('onlyAvailable') === '1'
  const focusedApartmentSlug = searchParams.get('apartment')

  // Fetch apartments from Firestore
  const { apartments, loading: apartmentsLoading } = useApartments()

  // Fetch availability for all apartments
  const { availabilityMap, loading: availabilityLoading } = useApartmentAvailability(
    apartments,
    checkIn,
    checkOut
  )

  const getLocalizedPath = (path: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('lang', locale)
    const search = current.toString()
    return `${path}?${search}`
  }

  // Filter apartments based on availability and guests capacity
  const filteredApartments = useMemo(() => {
    let result = apartments

    // Filter by guests capacity
    const selectedGuests = guests ? parseInt(guests, 10) : 1
    result = result.filter((apartment) => {
      return apartment.facts.guests >= selectedGuests
    })

    // Filter by availability if dates are selected and onlyAvailable is enabled
    if (checkIn && checkOut && onlyAvailable) {
      result = result.filter((apartment) => {
        const bookedRanges = availabilityMap[apartment.slug] || []
        return isApartmentAvailable(bookedRanges, checkIn, checkOut)
      })
    }

    return result
  }, [apartments, availabilityMap, checkIn, checkOut, onlyAvailable, guests])

  return (
    <div>
      {/* Hero Section with Gradient Fade */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 md:pt-24 pb-32 md:pb-40">
        {/* Banner Image with Gradient Fade */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner.jpg"
            alt="Grindelwald Mountains"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient fade: full opacity at top, invisible at bottom */}
          {/* Dark overlay at top for text readability, fades to transparent */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent"></div>
          {/* White gradient overlay to fade banner to invisible at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white"></div>
        </div>
        
        {/* Centered Title and Subtitle */}
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6">
            {locale === 'de'
              ? 'Stieregg Rentals'
              : 'Stieregg Rentals'}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mb-6 max-w-2xl mx-auto">
            {locale === 'de'
              ? 'Ihre perfekte Ferienwohnung in Grindelwald'
              : 'Your perfect holiday apartment in Grindelwald'}
          </p>
          {/* Best Price Sticker */}
          <div className="flex justify-center mt-4">
            <div className="inline-flex items-center gap-2 bg-gold/10 border-2 border-gold/30 rounded-lg px-4 py-2 md:px-5 md:py-2.5 backdrop-blur-sm">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-white text-sm md:text-base">
                {locale === 'de'
                  ? 'Bester Preis garantiert bei Buchungsanfrage'
                  : 'Best price guaranteed by booking request'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Apartments Section - Flows into Banner */}
      <section id="apartments" className="container mx-auto px-4 pt-0 pb-16 -mt-32 md:-mt-40 relative z-20">
        {/* Availability Bar */}
        <div className="mb-8 max-w-4xl mx-auto">
          <AvailabilityBar />
        </div>

        <div className="flex items-center justify-between mb-8">
          <SectionTitle>
            {locale === 'de' ? 'Unsere Apartments' : 'Our Apartments'}
          </SectionTitle>
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md">
            <button
              onClick={() => {
                setViewMode('grid')
                // Remove apartment parameter from URL to reset map highlight
                const params = new URLSearchParams(Array.from(searchParams.entries()))
                params.delete('apartment')
                params.delete('view')
                params.set('lang', locale)
                router.replace(`?${params.toString()}`, { scroll: false })
              }}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <HiOutlineViewGrid className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {locale === 'de' ? 'Raster' : 'Grid'}
                </span>
              </div>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'map'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <HiOutlineMap className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {locale === 'de' ? 'Karte' : 'Map'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {apartmentsLoading ? (
          <div className="text-center py-12 text-gray-500">
            {locale === 'de' ? 'Apartments werden geladen...' : 'Loading apartments...'}
          </div>
        ) : availabilityLoading && checkIn && checkOut ? (
          <div className="text-center py-12 text-gray-500">
            {locale === 'de' ? 'Verfügbarkeit wird geladen...' : 'Loading availability...'}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredApartments.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                {locale === 'de'
                  ? 'Keine Apartments verfügbar für die ausgewählten Daten.'
                  : 'No apartments available for the selected dates.'}
              </div>
            ) : (
              filteredApartments.map((apartment) => (
                <ApartmentCard
                  key={apartment.id}
                  apartment={apartment}
                  locale={locale}
                  bookedRanges={availabilityMap[apartment.slug] || []}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              ))
            )}
          </div>
        ) : (
          <MapView
            apartments={filteredApartments}
            locale={locale}
            focusedSlug={focusedApartmentSlug}
          />
        )}
      </section>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}

