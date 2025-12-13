'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { apartments } from '@/data/apartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'
import ApartmentCard from '@/components/ApartmentCard'
import MapView from '@/components/MapView'
import Image from 'next/image'
import { HiOutlineViewGrid, HiOutlineMap } from 'react-icons/hi'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

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
      {/* Hero Section with Gradient Fade */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden pt-20 md:pt-24 pb-0">
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
        <div className="relative z-10 text-center text-white px-4 pt-20 pb-32 md:pb-40">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6">
            {locale === 'de'
              ? 'Stieregg Rentals'
              : 'Stieregg Rentals'}
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl mb-8 max-w-2xl mx-auto">
            {locale === 'de'
              ? 'Ihre perfekte Ferienwohnung in Grindelwald'
              : 'Your perfect holiday apartment in Grindelwald'}
          </p>
        </div>
      </section>

      {/* Apartments Section - Flows into Banner */}
      <section id="apartments" className="container mx-auto px-4 pt-0 pb-16 -mt-32 md:-mt-40 relative z-20">
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

