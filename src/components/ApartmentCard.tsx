import Link from 'next/link'
import { Apartment } from '@/data/apartments'
import ImageCarousel from './ImageCarousel'
import Badge from './Badge'
import Button from './Button'
import { Locale } from '@/lib/locale'
import { buildMailtoLink } from '@/lib/booking'
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
  // Parse title and subtitle from apartment name
  // Pattern: "Title Apartment/Studio Name"
  // Example: "Chalet Walt Apartment Wega" -> Title: "Chalet Walt", Subtitle: "Apartment Wega"
  const fullName = apartment.name[locale]
  const match = fullName.match(/^(.+?)\s+(Apartment|Studio)\s+(.+)$/)
  
  const title = match ? match[1].trim() : fullName
  const subtitle = match ? `${match[2]} ${match[3]}`.trim() : null

  // Check availability if dates are selected
  const isAvailable = checkIn && checkOut
    ? isApartmentAvailable(bookedRanges, checkIn, checkOut)
    : true

  const hasDates = !!(checkIn && checkOut)
  const guestsNumber = guests ? parseInt(guests, 10) : undefined

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <ImageCarousel images={apartment.images} className="w-full" />

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
            <Badge variant={isAvailable ? undefined : undefined} className={isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
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

        {/* Booking Section */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">
            {locale === 'de' ? 'Buchung' : 'Booking'}
          </h4>
          
          {!hasDates ? (
            // Show hint if no dates selected
            <div className="text-sm text-gray-500 italic px-4 py-2">
              {locale === 'de' ? 'Bitte wählen Sie zuerst die Daten' : 'Select dates first'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!isAvailable ? (
                // Show message when dates are selected but apartment is not available
                <div className="text-sm text-gray-600 px-4 py-2 italic w-full text-center">
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
                    // Handle Booking request button specially
                    if (link.label === 'Booking request') {
                      const localizedLabel = locale === 'de' ? 'Buchungsanfrage' : 'Booking request'
                      
                      const handleBookingRequest = () => {
                        const name = prompt(locale === 'de' ? 'Bitte geben Sie Ihren Namen ein:' : 'Please enter your name:')
                        if (name) {
                          const mailtoLink = buildMailtoLink(
                            apartment,
                            checkIn!,
                            checkOut!,
                            guestsNumber,
                            name.trim(),
                            locale
                          )
                          window.location.href = mailtoLink
                        }
                      }
                      
                      return (
                        <Button
                          key={index}
                          onClick={handleBookingRequest}
                          variant="gold"
                          className="text-sm px-4 py-2"
                        >
                          {localizedLabel}
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
                        className="text-sm px-4 py-2"
                      >
                        {link.label}
                      </Button>
                    )
                  })
              )}
            </div>
          )}
        </div>

        <Link
          href={(() => {
            const params = new URLSearchParams()
            params.set('lang', locale)
            if (checkIn) params.set('checkIn', checkIn)
            if (checkOut) params.set('checkOut', checkOut)
            return `/apartments/${apartment.slug}?${params.toString()}`
          })()}
          className="block text-center text-accent hover:text-accent-dark font-medium transition-colors"
        >
          {locale === 'de' ? 'Details anzeigen' : 'View Details'} →
        </Link>
      </div>
    </div>
  )
}

