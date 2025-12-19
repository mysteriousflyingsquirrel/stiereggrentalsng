'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Apartment } from '@/data/apartments'
import Badge from './Badge'
import { Locale } from '@/lib/locale'

type ApartmentMiniCardProps = {
  apartment: Apartment
  locale: Locale
}

export default function ApartmentMiniCard({
  apartment,
  locale,
}: ApartmentMiniCardProps) {
  const searchParams = useSearchParams()
  const firstImage = apartment.images[0] || {
    src: '/images/default-image.jpg',
    alt: apartment.name[locale],
  }

  // Parse title and subtitle from apartment name
  // Pattern: "Title Apartment/Studio Name"
  // Example: "Chalet Walt Apartment Wega" -> Title: "Chalet Walt", Subtitle: "Apartment Wega"
  const fullName = apartment.name[locale]
  const match = fullName.match(/^(.+?)\s+(Apartment|Studio)\s+(.+)$/)
  
  const title = match ? match[1].trim() : fullName
  const subtitle = match ? `${match[2]} ${match[3]}`.trim() : null

  // Build link preserving all URL parameters (checkIn, checkOut, guests, etc.)
  const buildApartmentLink = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('lang', locale) // Ensure lang is set
    return `/apartments/${apartment.slug}?${params.toString()}`
  }

  return (
    <div className="w-64">
      <div className="relative">
        <div className="relative w-full h-32 rounded-lg overflow-hidden">
          <Image
            src={firstImage.src}
            alt={firstImage.alt}
            fill
            className="object-cover"
            sizes="256px"
          />
        </div>
        {/* Price Sticker */}
        {apartment.priceFrom && (
          <div className="absolute top-2 left-2 bg-accent text-white rounded-lg px-2 py-1 shadow-xl z-10 border-2 border-white/30">
            <span className="text-xs font-bold">
              {locale === 'de' ? 'ab' : 'from'} CHF {apartment.priceFrom}
            </span>
          </div>
        )}
      </div>

      <div className="py-4 title-subtitle-tight">
        <h3 className="text-base font-bold text-gray-900">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {subtitle}
          </p>
        )}
        {!subtitle && <div className="mb-3"></div>}

        <Link
          href={buildApartmentLink()}
          className="block text-center !text-gray-600 hover:!text-gray-900 font-medium transition-colors no-underline"
        >
          {locale === 'de' ? 'Details anzeigen' : 'View Details'} →
        </Link>
      </div>
    </div>
  )
}

