'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function PrivacyPageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  const content = {
    de: {
      title: 'Datenschutz',
      mainText: 'respektiert Ihre Privatsphäre. Diese Website erhebt keine personenbezogenen Daten, verwendet keine Cookies und dient ausschließlich zu Informationszwecken.',
      contact: {
        title: 'Kontakt:',
        text: 'Bei Fragen zum Datenschutz kontaktieren Sie uns gerne unter',
        email: 'info@stieregg.ch',
      },
    },
    en: {
      title: 'Privacy Policy',
      mainText: 'respects your privacy. This website does not collect any personal data, does not use cookies, and serves purely for informational purposes.',
      contact: {
        title: 'Contact:',
        text: 'For any privacy-related inquiries, feel free to contact us at',
        email: 'info@stieregg.ch',
      },
    },
  }

  const pageContent = content[locale]

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionTitle>{pageContent.title}</SectionTitle>
      <div className="max-w-3xl space-y-8">
        {/* Main Privacy Statement */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <p className="text-gray-700 leading-relaxed">
            <span className="font-bold">Stieregg Rentals GmbH</span>{' '}
            {pageContent.mainText}
          </p>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{pageContent.contact.title}</h2>
          <p className="text-gray-700 leading-relaxed">
            {pageContent.contact.text}{' '}
            <a href={`mailto:${pageContent.contact.email}`} className="text-accent hover:text-accent-dark transition-colors">
              {pageContent.contact.email}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PrivacyPageContent />
    </Suspense>
  )
}

