'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'

function ImpressumPageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  const content = {
    de: {
      title: 'Impressum',
      sections: [
        {
          title: 'Angaben gemäß § 5 TMG',
          text: 'Stieregg Rentals\nGrindelwald\nSchweiz',
        },
        {
          title: 'Kontakt',
          text: 'E-Mail: info@stieregg.ch',
        },
        {
          title: 'Verantwortlich für den Inhalt',
          text: 'Stieregg Rentals\nGrindelwald\nSchweiz',
        },
      ],
    },
    en: {
      title: 'Legal Notice',
      sections: [
        {
          title: 'Information according to § 5 TMG',
          text: 'Stieregg Rentals\nGrindelwald\nSwitzerland',
        },
        {
          title: 'Contact',
          text: 'Email: info@stieregg.ch',
        },
        {
          title: 'Responsible for content',
          text: 'Stieregg Rentals\nGrindelwald\nSwitzerland',
        },
      ],
    },
  }

  const pageContent = content[locale]

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionTitle>{pageContent.title}</SectionTitle>
      <div className="max-w-3xl space-y-8">
        {pageContent.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {section.text}
            </p>
          </div>
        ))}
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

