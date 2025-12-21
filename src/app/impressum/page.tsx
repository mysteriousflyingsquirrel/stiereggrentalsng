'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function ImpressumPageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  const content = {
    de: {
      title: 'Impressum',
      company: {
        name: 'Stieregg Rentals GmbH',
        address: 'Weidweg 5, Switzerland',
        city: '3818 Grindelwald, Switzerland',
        email: 'info@stieregg.ch',
      },
      details: {
        director: 'Geschäftsführer:',
        directorName: 'Andreas Kaufmann',
        vat: 'Mehrwertsteuernummer (UID):',
        vatNumber: 'CHE-202.275.796',
        companyId: 'Firmenidentifikationsnummer (CH-ID):',
        companyIdNumber: 'CH-036.4101075.8',
      },
      disclaimer: {
        title: 'Haftungsausschluss:',
        text: 'Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.',
      },
    },
    en: {
      title: 'Impressum',
      company: {
        name: 'Stieregg Rentals GmbH',
        address: 'Weidweg 5, Switzerland',
        city: '3818 Grindelwald, Switzerland',
        email: 'info@stieregg.ch',
      },
      details: {
        director: 'Managing Director:',
        directorName: 'Andreas Kaufmann',
        vat: 'VAT Number (UID):',
        vatNumber: 'CHE-202.275.796',
        companyId: 'Company ID (CH-ID):',
        companyIdNumber: 'CH-036.4101075.8',
      },
      disclaimer: {
        title: 'Disclaimer:',
        text: 'The content of this website has been created with the utmost care. However, we cannot guarantee the accuracy, completeness, or timeliness of the content.',
      },
    },
  }

  const pageContent = content[locale]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl space-y-8">
        {/* Company Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="space-y-2 text-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{pageContent.title}</h2>
            <p className="font-bold text-gray-900">{pageContent.company.name}</p>
            <p>{pageContent.company.address}</p>
            <p>{pageContent.company.city}</p>
            <p>
              <span className="font-medium">Email:</span>{' '}
              <a href={`mailto:${pageContent.company.email}`} className="text-accent hover:text-accent-dark transition-colors">
                {pageContent.company.email}
              </a>
            </p>
            <p className="mt-3">
              <span className="font-medium">{pageContent.details.director}</span>{' '}
              {pageContent.details.directorName}
            </p>
            <p>
              <span className="font-medium">{pageContent.details.vat}</span>{' '}
              {pageContent.details.vatNumber}
            </p>
            <p>
              <span className="font-medium">{pageContent.details.companyId}</span>{' '}
              {pageContent.details.companyIdNumber}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{pageContent.disclaimer.title}</h2>
          <p className="text-gray-700 leading-relaxed">{pageContent.disclaimer.text}</p>
        </div>
      </div>
    </div>
  )
}

export default function ImpressumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ImpressumPageContent />
    </Suspense>
  )
}

