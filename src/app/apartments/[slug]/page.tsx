'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import ImageCarousel from '@/components/ImageCarousel'
import { getApartmentBySlug } from '@/data/apartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import Link from 'next/link'
import { buildMailtoLink } from '@/lib/booking'
import { isApartmentAvailable } from '@/lib/booking'
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
  
  // Check availability if dates are selected
  const hasDates = !!(checkIn && checkOut)
  const isAvailable = hasDates && !availabilityLoading
    ? isApartmentAvailable(bookedRanges, checkIn, checkOut)
    : true
  
  const handleBookingRequest = (apartment: any, checkIn: string, checkOut: string, guestsNumber?: number) => {
    const name = prompt(locale === 'de' ? 'Bitte geben Sie Ihren Namen ein:' : 'Please enter your name:')
    if (name) {
      const mailtoLink = buildMailtoLink(
        apartment,
        checkIn,
        checkOut,
        guestsNumber,
        name.trim(),
        locale
      )
      window.location.href = mailtoLink
    }
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sticky Book Button for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40 p-4">
        <div className="flex gap-2">
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
              
              // Handle Booking request button specially - generate mailto link with dates
              if (link.label === 'Booking request') {
                if (!checkIn || !checkOut) {
                  // Show hint if dates not selected
                  return (
                    <div key={index} className="text-sm text-gray-500 italic px-4 py-2 text-center">
                      {locale === 'de' ? 'Bitte wählen Sie zuerst die Daten' : 'Select dates first'}
                    </div>
                  )
                }
                
                // Generate mailto link with selected dates
                const guestsParam = searchParams.get('guests')
                const guestsNumber = guestsParam ? parseInt(guestsParam, 10) : undefined
                
                return (
                  <Button
                    key={index}
                    onClick={() => handleBookingRequest(apartment, checkIn, checkOut, guestsNumber)}
                    variant="gold"
                    className="flex-1 text-sm py-3"
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
                  className="flex-1 text-sm py-3"
                >
                  {displayLabel}
                </Button>
              )
            })
            .filter(Boolean)}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
          {title}
        </h1>
        {subtitle && (
          <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-8">
            {subtitle}
          </p>
        )}
        {!subtitle && <div className="mb-8"></div>}
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

      {/* Image Gallery - Map to images_big folder */}
      <div className="mb-12 -mx-4 md:-mx-6 lg:-mx-8">
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

      {/* Facts */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {locale === 'de' ? 'Ausstattung' : 'Amenities'}
        </h2>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {locale === 'de' ? 'Gäste' : 'Guests'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {apartment.facts.guests}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {locale === 'de' ? 'Schlafzimmer' : 'Bedrooms'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {apartment.facts.bedrooms}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {locale === 'de' ? 'Betten' : 'Beds'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {apartment.facts.beds}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {locale === 'de' ? 'Badezimmer' : 'Bathrooms'}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {apartment.facts.bathrooms}
              </div>
            </div>
            {apartment.facts.sqm && (
              <div>
                <div className="text-sm text-gray-500 mb-1">m²</div>
                <div className="text-2xl font-bold text-gray-900">
                  {apartment.facts.sqm}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability Calendar and Booking - Side by side on larger screens */}
      <div className="mb-12 md:mb-0 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Availability Calendar */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'de' ? 'Verfügbarkeit' : 'Availability'}
          </h2>
          <AvailabilityCalendar 
            slug={apartment.slug} 
            months={1} 
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
        <div>
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
                <Badge variant="accent" className="text-base px-4 py-2">
                  {new Date(checkIn).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
                <span className="text-gray-400">→</span>
                <Badge variant="accent" className="text-base px-4 py-2">
                  {new Date(checkOut).toLocaleDateString(locale === 'de' ? 'de-CH' : 'en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Badge>
              </div>
              
              {/* Availability badge */}
              {!availabilityLoading && (
                <div className="mb-4">
                  <Badge 
                    variant={isAvailable ? undefined : undefined} 
                    className={isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                  >
                    {isAvailable
                      ? locale === 'de' ? 'Verfügbar' : 'Available'
                      : locale === 'de' ? 'Nicht verfügbar' : 'Not available'}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Booking buttons */}
            {!availabilityLoading && (
              <div className="flex flex-wrap gap-4">
                {!isAvailable ? (
                  // Show message when dates are selected but apartment is not available
                  <div className="text-sm text-gray-600 px-4 py-2 italic w-full">
                    {locale === 'de'
                      ? 'Keine Verfügbarkeit für diese Daten. Bitte wählen Sie andere Daten.'
                      : 'No availability on these dates. Please choose other dates.'}
                  </div>
                ) : (
                  // Show booking buttons when dates are selected and apartment is available
                  [...apartment.bookingLinks]
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
                      
                      // Handle Booking request button specially - generate mailto link with dates
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
                    })
                )}
              </div>
            )}
          </>
        )}
        </div>
      </div>
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

