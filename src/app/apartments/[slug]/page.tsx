'use client'

import { Suspense } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import Image from 'next/image'
import { getApartmentBySlug } from '@/data/apartments'
import { getLocaleFromSearchParams } from '@/lib/locale'
import Button from '@/components/Button'
import Badge from '@/components/Badge'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import Link from 'next/link'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function ApartmentDetailPageContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)
  const slug = params.slug as string
  const apartment = getApartmentBySlug(slug)

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
              // Always put "Direct Booking" first
              if (a.label === 'Direct Booking') return -1
              if (b.label === 'Direct Booking') return 1
              return 0
            })
            .map((link, index) => (
              <Button
                key={index}
                href={link.url}
                variant={link.label === 'Direct Booking' ? 'gold' : 'primary'}
                external
                className="flex-1 text-sm py-3"
              >
                {link.label}
              </Button>
            ))}
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {apartment.name[locale]}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {apartment.shortDescription[locale]}
        </p>
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

      {/* Image Gallery */}
      <div className="mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apartment.images.map((image, index) => (
            <div
              key={index}
              className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
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

      {/* Availability Calendar */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {locale === 'de' ? 'Verfügbarkeit' : 'Availability'}
        </h2>
        <AvailabilityCalendar slug={apartment.slug} months={6} locale={locale} />
      </div>

      {/* Booking Buttons */}
      <div className="mb-12 md:mb-0">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {locale === 'de' ? 'Buchung' : 'Booking'}
        </h2>
        <div className="flex flex-wrap gap-4">
          {[...apartment.bookingLinks]
            .sort((a, b) => {
              // Always put "Direct Booking" first
              if (a.label === 'Direct Booking') return -1
              if (b.label === 'Direct Booking') return 1
              return 0
            })
            .map((link, index) => (
              <Button
                key={index}
                href={link.url}
                variant={link.label === 'Direct Booking' ? 'gold' : 'primary'}
                external
                className="text-lg px-8 py-4"
              >
                {link.label}
              </Button>
            ))}
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

