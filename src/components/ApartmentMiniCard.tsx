import Image from 'next/image'
import Link from 'next/link'
import { Apartment } from '@/data/apartments'
import Button from './Button'
import { Locale } from '@/lib/locale'

type ApartmentMiniCardProps = {
  apartment: Apartment
  locale: Locale
}

export default function ApartmentMiniCard({
  apartment,
  locale,
}: ApartmentMiniCardProps) {
  const firstImage = apartment.images[0] || {
    src: '/images/default-image.jpg',
    alt: apartment.name[locale],
  }

  return (
    <div className="w-64">
      <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden">
        <Image
          src={firstImage.src}
          alt={firstImage.alt}
          fill
          className="object-cover"
          sizes="256px"
        />
      </div>
      <h4 className="font-bold text-gray-900 mb-1">{apartment.name[locale]}</h4>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {apartment.shortDescription[locale]}
      </p>
      <Button
        href={`/apartments/${apartment.slug}?lang=${locale}`}
        variant="primary"
        className="w-full text-sm py-2"
      >
        {locale === 'de' ? 'Details öffnen' : 'Open Details'}
      </Button>
    </div>
  )
}

