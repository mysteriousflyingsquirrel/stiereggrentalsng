import Link from 'next/link'
import { Apartment } from '@/data/apartments'
import ImageCarousel from './ImageCarousel'
import Badge from './Badge'
import Button from './Button'
import AvailabilityCalendar from './AvailabilityCalendar'
import { Locale } from '@/lib/locale'

type ApartmentCardProps = {
  apartment: Apartment
  locale: Locale
  showCalendar?: boolean
}

export default function ApartmentCard({
  apartment,
  locale,
  showCalendar = true,
}: ApartmentCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <ImageCarousel images={apartment.images} className="w-full" />

      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {apartment.name[locale]}
        </h3>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {apartment.shortDescription[locale]}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
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

        {showCalendar && (
          <div className="mb-4">
            <AvailabilityCalendar slug={apartment.slug} months={2} locale={locale} />
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {apartment.bookingLinks.map((link, index) => (
            <Button
              key={index}
              href={link.url}
              variant="primary"
              external
              className="text-sm px-4 py-2"
            >
              {link.label}
            </Button>
          ))}
        </div>

        <Link
          href={`/apartments/${apartment.slug}?lang=${locale}`}
          className="block text-center text-accent hover:text-accent-dark font-medium transition-colors"
        >
          {locale === 'de' ? 'Details anzeigen' : 'View Details'} →
        </Link>
      </div>
    </div>
  )
}

