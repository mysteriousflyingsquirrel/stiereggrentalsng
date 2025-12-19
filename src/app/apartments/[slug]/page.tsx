'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import ImageCarousel from '@/components/ImageCarousel'
import { apartments, getApartmentBySlug } from '@/data/apartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import BookingModal from '@/components/BookingModal'
import Link from 'next/link'
import { buildMailtoLink, isApartmentAvailable, getStayNights, getSeasonalMinNights, meetsMinimumNights } from '@/lib/booking'
import { BookedRange } from '@/lib/availability'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function ApartmentDetailPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const locale = getLocaleFromSearchParams(searchParams)
  const slug = params.slug as string
  const apartment = getApartmentBySlug(slug)
  
  // Get selected dates from URL params
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')
  
  // Fetch availability data
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  
  useEffect(() => {
    async function fetchAvailability() {
      if (!apartment) return
      try {
        const response = await fetch(`/api/availability?slug=${apartment.slug}`)
        if (response.ok) {
          const data = await response.json()
          setBookedRanges(data.bookedRanges || [])
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
      } finally {
        setAvailabilityLoading(false)
      }
    }
    
    fetchAvailability()
  }, [apartment])
  
  const handleBookingRequest = (apartment: any, checkIn: string, checkOut: string, guestsNumber?: number) => {
    setIsBookingModalOpen(true)
  }

  const handleBookingConfirm = (name: string) => {
    if (!apartment || !checkIn || !checkOut) return
    
    const guestsParam = searchParams.get('guests')
    const guestsNumber = guestsParam ? parseInt(guestsParam, 10) : undefined
    
    const mailtoLink = buildMailtoLink(
      apartment,
      checkIn,
      checkOut,
      guestsNumber,
      name,
      locale
    )
    window.location.href = mailtoLink
  }

  // Check availability if dates are selected (after apartment is confirmed non-null)
  const hasDates = !!(checkIn && checkOut)
  const nights = hasDates && checkIn && checkOut ? getStayNights(checkIn, checkOut) : 0
  const isAvailable = hasDates && !availabilityLoading && checkIn && checkOut
    ? isApartmentAvailable(bookedRanges, checkIn, checkOut)
    : true
  const meetsMinNights = hasDates && checkIn && checkOut
    ? meetsMinimumNights(apartment!, checkIn, checkOut)
    : true
  const seasonalMinNights = hasDates && checkIn
    ? getSeasonalMinNights(checkIn, apartment)
    : getSeasonalMinNights(new Date().toISOString().slice(0, 10), apartment)
  const isBookable = hasDates && !availabilityLoading
    ? isAvailable && meetsMinNights
    : true

  if (!apartment) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Apartment not found</p>
        <Button href="/" variant="primary">
          {locale === 'de' ? 'Zur Startseite' : 'Go back home'}
        </Button>
      </div>
    )
  }

  // Parse title and subtitle from apartment name
  // Pattern: "Title Apartment/Studio Name"
  // Example: "Chalet Walt Apartment Wega" -> Title: "Chalet Walt", Subtitle: "Apartment Wega"
  const fullName = apartment.name[locale]
  const match = fullName.match(/^(.+?)\s+(Apartment|Studio)\s+(.+)$/)
  
  const title = match ? match[1].trim() : fullName
  const subtitle = match ? `${match[2]} ${match[3]}`.trim() : null

  const getLocalizedPath = (path: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('lang', locale)
    const search = current.toString()
    return `${path}?${search}`
  }

  const buildMapHref = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    params.set('lang', locale)
    params.set('view', 'map')
    params.set('apartment', apartment.slug)
    const search = params.toString()
    return `/${search ? `?${search}` : ''}#apartments`
  }

  // Basic JSON-LD structured data for this apartment
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: apartment.name[locale],
    description: apartment.longDescription?.[locale] ?? '',
    url:
      typeof window !== 'undefined'
        ? `${window.location.origin}/apartments/${apartment.slug}`
        : `/apartments/${apartment.slug}`,
    image: apartment.images.map((img) =>
      typeof window !== 'undefined'
        ? `${window.location.origin}${img.src}`
        : img.src
    ),
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Weidweg 5',
      addressLocality: 'Grindelwald',
      postalCode: '3818',
      addressCountry: 'CH',
    },
    telephone: '+41 79 768 39 73',
    priceRange: apartment.priceFrom ? `CHF ${apartment.priceFrom}+` : undefined,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb / back links */}
      <nav className="mb-4 text-sm text-gray-600">
        <Link href={getLocalizedPath('/')} className="hover:text-accent">
          {locale === 'de' ? 'Startseite' : 'Home'}
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`${getLocalizedPath('/')}#apartments`}
          className="hover:text-accent"
        >
          {locale === 'de' ? 'Unsere Apartments' : 'Our Apartments'}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{subtitle || title}</span>
      </nav>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4 md:mb-6">
                {subtitle}
              </p>
            )}
            {!subtitle && <div className="mb-4 md:mb-6"></div>}
            <div className="flex flex-wrap gap-2">
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
              {apartment.facts.sqm && <Badge>{apartment.facts.sqm} m²</Badge>}
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button
              href={buildMapHref()}
              variant="secondary"
              className="px-5 py-2 text-sm md:text-base"
            >
              {locale === 'de' ? 'Auf Karte anzeigen' : 'Show on Map'}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery - Map to images_big folder */}
      <div className="mb-12 relative">
        {/* Price Sticker */}
        {apartment.priceFrom && (
          <div className="absolute top-6 left-6 bg-accent text-white rounded-lg px-5 py-3 shadow-xl z-10 border-2 border-white/30">
            <span className="text-xl font-bold">
              {locale === 'de' ? 'ab' : 'from'} CHF {apartment.priceFrom}
            </span>
          </div>
        )}
        <div className="w-full">
          <ImageCarousel 
            quality={95}
            sizes="100vw"
            images={apartment.images.map(image => {
              // Transform image path from /images/ to /images_big/
              // Remove _768px suffix to match images_big filenames
              const originalPath = image.src
              const pathMatch = originalPath.match(/\/images\/([^/]+)\/([^/]+)$/)
              
              if (!pathMatch) {
                // Fallback: simple replacement
                return {
                  ...image,
                  src: originalPath.replace('/images/', '/images_big/').replace(/_768px\./, '.')
                }
              }
              
              const [, folder, filename] = pathMatch
              // Remove _768px suffix (e.g., cwaw_wohnzimmer_768px.jpg -> cwaw_wohnzimmer.jpg)
              let bigFilename = filename.replace(/_768px\.(jpg|jpeg|png|webp)$/i, '.$1')
              
              // Special case: cwaw_aussen_768px.jpg -> cwaw_aussen_1.JPG
              if (bigFilename === 'cwaw_aussen.jpg') {
                bigFilename = 'cwaw_aussen_1.JPG'
              } else {
                // Normalize extension to lowercase for other files
                bigFilename = bigFilename.replace(/\.(JPG|JPEG|PNG|WEBP)$/i, (match) => match.toLowerCase())
              }
              
              const bigImagePath = `/images_big/${folder}/${bigFilename}`
              
              return {
                ...image,
                src: bigImagePath
              }
            })} 
            className="w-full h-80 md:h-96 lg:h-[500px]" 
          />
        </div>
      </div>

      {/* Description */}
      {apartment.longDescription && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'de' ? 'Beschreibung' : 'Description'}
          </h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {apartment.longDescription[locale]}
          </p>
        </div>
      )}

      {/* Amenities */}
      {apartment.amenities && apartment.amenities[locale].length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'de' ? 'Ausstattung' : 'Amenities'}
          </h2>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {apartment.amenities[locale].map((amenity, index) => {
                  const getIcon = (amenityText: string) => {
                    const lower = amenityText.toLowerCase()
                    // SVG icons for each amenity
                    if (lower.includes('dishwasher') || lower.includes('geschirrspüler')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )
                    }
                    if (lower.includes('washing') || lower.includes('waschmaschine')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      )
                    }
                    if (lower.includes('tv') && !lower.includes('receiver')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )
                    }
                    if (lower.includes('wifi') || lower.includes('wi-fi')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                        </svg>
                      )
                    }
                    if (lower.includes('fireplace') || lower.includes('kamin')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                      )
                    }
                    if (lower.includes('microwave')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                      )
                    }
                    if (lower.includes('parking') || lower.includes('parkplatz')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )
                    }
                    if (lower.includes('no pets') || lower.includes('keine haustiere')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                    }
                    if (lower.includes('no smoking') || lower.includes('nichtraucher')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      )
                    }
                    if (lower.includes('kitchen') || lower.includes('küche')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      )
                    }
                    if (lower.includes('cot') || lower.includes('kinderbett')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )
                    }
                    if (lower.includes('family') || lower.includes('familienfreundlich')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )
                    }
                    if (lower.includes('heating') || lower.includes('heizung')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )
                    }
                    if (lower.includes('fridge') || lower.includes('kühlschrank')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )
                    }
                    if (lower.includes('freezer') || lower.includes('gefrierschrank')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      )
                    }
                    if (lower.includes('lift') || lower.includes('aufzug')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )
                    }
                    if (lower.includes('dryer') || lower.includes('trockner')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      )
                    }
                    if (lower.includes('balcony') || lower.includes('balkon')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      )
                    }
                    if (lower.includes('mountain') || lower.includes('bergblick')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      )
                    }
                    if (lower.includes('nature view') || lower.includes('naturblick')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )
                    }
                    if (lower.includes('bed linen') || lower.includes('bettwäsche')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      )
                    }
                    if (lower.includes('towel') || lower.includes('handtuch')) {
                      return (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      )
                    }
                    // Default checkmark icon
                    return (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )
                  }

                  return (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <div className="text-gray-500 flex-shrink-0">
                        {getIcon(amenity)}
                      </div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Availability Calendar and Booking - Side by side on larger screens */}
      <div className="mb-12 md:mb-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Availability Calendar */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'de' ? 'Verfügbarkeit' : 'Availability'}
          </h2>
          <AvailabilityCalendar 
            slug={apartment.slug} 
            months={2} 
            locale={locale}
            checkIn={checkIn}
            checkOut={checkOut}
            showMonthSelector={true}
            onDateSelect={(newCheckIn, newCheckOut) => {
              // Update URL params when dates are selected
              const params = new URLSearchParams(searchParams.toString())
              
              if (newCheckIn) {
                params.set('checkIn', newCheckIn)
              } else {
                params.delete('checkIn')
              }
              
              if (newCheckOut) {
                params.set('checkOut', newCheckOut)
              } else {
                params.delete('checkOut')
              }
              
              // Preserve lang param
              params.set('lang', locale)
              
              router.replace(`?${params.toString()}`, { scroll: false })
            }}
          />
        </div>

        {/* Booking Section */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'de' ? 'Buchung' : 'Booking'}
          </h2>

        {!hasDates ? (
          // Show hint if no dates selected
          <div className="text-sm text-gray-500 italic px-4 py-2">
            {locale === 'de' ? 'Bitte wählen Sie zuerst die Daten' : 'Select dates first'}
          </div>
        ) : (
          <>
            {/* Show selected dates */}
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                {locale === 'de' ? 'Ausgewählte Daten:' : 'Selected dates:'}
              </div>
              <div className="flex flex-wrap gap-2 items-center mb-3">
                <Badge variant="accent" className="text-base px-4 py-2 border border-transparent">
                  {new Date(checkIn).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="accent" className="text-base px-4 py-2 border border-transparent">
                  {new Date(checkOut).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
                {/* Nights badge */}
                {hasDates && (
                  <Badge
                    className={`text-base px-4 py-2 border ${
                      nights < seasonalMinNights
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}
                  >
                    {locale === 'de'
                      ? `${nights} ${nights === 1 ? 'Nacht' : 'Nächte'}`
                      : `${nights} night${nights !== 1 ? 's' : ''}`}
                  </Badge>
                )}
              </div>
              {/* Minimum stay info below has been removed as it is now covered by the nights badge */}
            </div>
            
            {/* Booking buttons */}
            {!availabilityLoading && (
              <div className="flex flex-wrap gap-4">
                {!isAvailable ? (
                  // Show message when dates are selected but apartment is not available
                  <div className="text-sm text-gray-600 py-2 italic w-full">
                    {locale === 'de'
                      ? 'Keine Verfügbarkeit für diese Daten. Bitte wählen Sie andere Daten.'
                      : 'No availability on these dates. Please choose other dates.'}
                  </div>
                ) : !meetsMinNights ? (
                  // Available but stay is shorter than minimum requirement
                  <div className="text-sm text-gray-600 py-2 italic w-full">
                    {locale === 'de'
                      ? `Die gewählte Aufenthaltsdauer unterschreitet den saisonalen Mindestaufenthalt von ${seasonalMinNights} ${seasonalMinNights === 1 ? 'Nacht' : 'Nächten'}. Bitte wählen Sie längere Daten.`
                      : `The selected stay is shorter than the seasonal minimum of ${seasonalMinNights} night${seasonalMinNights !== 1 ? 's' : ''}. Please choose a longer stay.`}
                  </div>
                ) : (
                  // Show booking buttons when dates are selected, apartment is available, and minimum nights are met
                  <>
                    {/* Best Price Message - only show when booking is possible */}
                    <div className="mt-4 mb-1 bg-gold/10 border-2 border-gold/30 rounded-lg p-4 w-full">
                      <div className="flex items-start gap-3">
                        <svg className="w-6 h-6 text-gold flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">
                            {locale === 'de' ? 'Bester Preis garantiert!' : 'Best price guaranteed!'}
                          </p>
                          <p className="text-sm text-gray-700">
                            {locale === 'de' 
                              ? 'Buchen Sie direkt über unsere Buchungsanfrage und erhalten Sie den günstigsten Preis.' 
                              : 'Book directly through our booking request and get the cheapest price available.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {[...apartment.bookingLinks]
                      .sort((a, b) => {
                        // Always put "Booking request" / "Buchungsanfrage" first
                        if (a.label === 'Booking request') return -1
                        if (b.label === 'Booking request') return 1
                        return 0
                      })
                      .map((link, index) => {
                        const displayLabel = link.label === 'Booking request' 
                          ? (locale === 'de' ? 'Buchungsanfrage' : 'Booking request')
                          : link.label
                        
                        // Handle Booking request button specially - open booking modal first
                        if (link.label === 'Booking request') {
                          const guestsParam = searchParams.get('guests')
                          const guestsNumber = guestsParam ? parseInt(guestsParam, 10) : undefined
                          
                          return (
                            <Button
                              key={index}
                              onClick={() => handleBookingRequest(apartment, checkIn!, checkOut!, guestsNumber)}
                              variant="gold"
                              className="text-lg px-8 py-4"
                            >
                              {displayLabel}
                            </Button>
                          )
                        }
                        
                        // Regular booking links
                        return (
                          <Button
                            key={index}
                            href={link.url}
                            variant="primary"
                            external
                            className="text-lg px-8 py-4"
                          >
                            {displayLabel}
                          </Button>
                        )
                      })}
                  </>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>

      {/* Booking Modal */}
      {apartment && checkIn && checkOut && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          apartment={apartment}
          checkIn={checkIn}
          checkOut={checkOut}
          locale={locale}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* More apartments */}
      <section className="mt-12 border-t pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {locale === 'de'
            ? 'Weitere Apartments in Grindelwald'
            : 'More apartments in Grindelwald'}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          {apartments
            .filter((apt) => apt.slug !== apartment.slug)
            .map((apt) => (
              <Link
                key={apt.slug}
                href={`/apartments/${apt.slug}?lang=${locale}`}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-white shadow-sm border border-gray-200 text-gray-800 hover:border-accent hover:text-accent transition-colors"
              >
                {apt.name[locale]}
              </Link>
            ))}
        </div>
      </section>
    </div>
  )
}

export default function ApartmentDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ApartmentDetailPageContent />
    </Suspense>
  )
}

