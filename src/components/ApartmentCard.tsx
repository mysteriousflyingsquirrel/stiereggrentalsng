import Link from 'next/link'
import { Apartment } from '@/data/apartments'
import ImageCarousel from './ImageCarousel'
import Badge from './Badge'
import { Locale } from '@/lib/locale'

type ApartmentCardProps = {
  apartment: Apartment
  locale: Locale
}

export default function ApartmentCard({
  apartment,
  locale,
}: ApartmentCardProps) {

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
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          {apartment.name[locale]}
        </h3>

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

