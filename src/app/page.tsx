'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apartments } from '@/data/apartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'
import ApartmentCard from '@/components/ApartmentCard'
import MapView from '@/components/MapView'
import Button from '@/components/Button'
import Image from 'next/image'

function HomePageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const getLocalizedPath = (path: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('lang', locale)
    const search = current.toString()
    return `${path}?${search}`
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/banner.jpg"
            alt="Grindelwald Mountains"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {locale === 'de'
              ? 'Luxuriöse Ferienwohnungen in Grindelwald'
              : 'Luxury Holiday Apartments in Grindelwald'}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            {locale === 'de'
              ? 'Erleben Sie unvergessliche Momente in den Schweizer Alpen'
              : 'Experience unforgettable moments in the Swiss Alps'}
          </p>
          <Button
            href={getLocalizedPath('/#apartments')}
            variant="primary"
            className="text-lg px-8 py-4"
          >
            {locale === 'de' ? 'Jetzt buchen' : 'Book now'}
          </Button>
        </div>
      </section>

      {/* Apartments Section */}
      <section id="apartments" className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <SectionTitle>
            {locale === 'de' ? 'Unsere Apartments' : 'Our Apartments'}
          </SectionTitle>
          <div className="flex gap-2 bg-white rounded-xl p-1 shadow-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/icons/grid.png"
                  alt="Grid view"
                  width={20}
                  height={20}
                />
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
                <Image
                  src="/icons/map.png"
                  alt="Map view"
                  width={20}
                  height={20}
                />
                <span className="hidden sm:inline">
                  {locale === 'de' ? 'Karte' : 'Map'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.map((apartment) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                locale={locale}
                showCalendar={true}
              />
            ))}
          </div>
        ) : (
          <MapView apartments={apartments} locale={locale} />
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

