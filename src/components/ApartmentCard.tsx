'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Apartment } from '@/data/apartments'
import ImageCarousel from './ImageCarousel'
import Badge from './Badge'
import { Locale } from '@/lib/locale'
import { BookedRange } from '@/lib/availability'
import { isApartmentAvailable } from '@/lib/booking'

type ApartmentCardProps = {
  apartment: Apartment
  locale: Locale
  bookedRanges?: BookedRange[]
  checkIn?: string | null
  checkOut?: string | null
  guests?: string | null
}

export default function ApartmentCard({
  apartment,
  locale,
  bookedRanges = [],
  checkIn = null,
  checkOut = null,
  guests = null,
}: ApartmentCardProps) {
  const searchParams = useSearchParams()
  
  // Parse title and subtitle from apartment name
  // Pattern: "Title Apartment/Studio Name"
  // Example: "Chalet Walt Apartment Wega" -> Title: "Chalet Walt", Subtitle: "Apartment Wega"
  const fullName = apartment.name[locale]
  const match = fullName.match(/^(.+?)\s+(Apartment|Studio)\s+(.+)$/)
  
  const title = match ? match[1].trim() : fullName
  const subtitle = match ? `${match[2]} ${match[3]}`.trim() : null

  // Check availability if dates are selected
  const hasDates = !!(checkIn && checkOut)
  const isAvailable = hasDates
    ? isApartmentAvailable(bookedRanges, checkIn, checkOut)
    : true

  // Build link preserving all URL parameters (checkIn, checkOut, guests, etc.)
  const buildApartmentLink = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('lang', locale) // Ensure lang is set
    return `/apartments/${apartment.slug}?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative">
        <ImageCarousel images={apartment.images} className="w-full" />
        {/* Price Sticker */}
        {apartment.priceFrom && (
          <div className="absolute top-4 left-4 bg-accent text-white rounded-lg px-4 py-2 shadow-xl z-10 border-2 border-white/30">
            <span className="text-base font-bold">
              {locale === 'de' ? 'ab' : 'from'} CHF {apartment.priceFrom}
            </span>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xl font-semibold text-gray-700 mb-4">
            {subtitle}
          </p>
        )}
        {!subtitle && <div className="mb-4"></div>}

        <div className="flex flex-wrap gap-2 mb-4">
          {hasDates && (
            <Badge 
              variant={isAvailable ? undefined : undefined} 
              className={isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            >
              {isAvailable
                ? locale === 'de' ? 'Verfügbar' : 'Available'
                : locale === 'de' ? 'Nicht verfügbar' : 'Not available'}
            </Badge>
          )}
          <Badge variant="accent">
            {apartment.facts.guests} {locale === 'de' ? 'Gäste' : 'Guests'}
          </Badge>
          <Badge>
            {apartment.facts.bedrooms} {locale === 'de' ? 'Schlafzimmer' : 'Bedrooms'}
          </Badge>
          <Badge>
            {apartment.facts.beds} {locale === 'de' ? 'Betten' : 'Beds'}
          </Badge>
          <Badge>
            {apartment.facts.bathrooms} {locale === 'de' ? 'Badezimmer' : 'Bathrooms'}
          </Badge>
          {apartment.facts.sqm && (
            <Badge>{apartment.facts.sqm} m²</Badge>
          )}
        </div>

        <Link
          href={buildApartmentLink()}
          className="block text-center text-accent hover:text-accent-dark font-medium transition-colors"
        >
          {locale === 'de' ? 'Details anzeigen' : 'View Details'} →
        </Link>
      </div>
    </div>
  )
}

