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
      title: 'Datenschutzerklärung',
      sections: [
        {
          title: 'Datenschutz',
          text: 'Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. In dieser Datenschutzerklärung informieren wir Sie über die Verarbeitung personenbezogener Daten bei der Nutzung unserer Website.',
        },
        {
          title: 'Verantwortliche Stelle',
          text: 'Verantwortlich für die Datenverarbeitung ist:\nStieregg Rentals\nGrindelwald\nSchweiz\nE-Mail: info@stieregg.ch',
        },
        {
          title: 'Erhebung und Speicherung personenbezogener Daten',
          text: 'Beim Besuch unserer Website werden automatisch Informationen an den Server unserer Website gesendet. Diese Informationen werden temporär in einem sogenannten Logfile gespeichert.',
        },
        {
          title: 'Ihre Rechte',
          text: 'Sie haben jederzeit das Recht, Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten zu erhalten. Außerdem haben Sie ein Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung Ihrer personenbezogenen Daten.',
        },
      ],
    },
    en: {
      title: 'Privacy Policy',
      sections: [
        {
          title: 'Privacy',
          text: 'The protection of your personal data is of particular concern to us. In this privacy policy, we inform you about the processing of personal data when using our website.',
        },
        {
          title: 'Responsible Party',
          text: 'Responsible for data processing is:\nStieregg Rentals\nGrindelwald\nSwitzerland\nEmail: info@stieregg.ch',
        },
        {
          title: 'Collection and Storage of Personal Data',
          text: 'When you visit our website, information is automatically sent to the server of our website. This information is temporarily stored in a so-called log file.',
        },
        {
          title: 'Your Rights',
          text: 'You have the right at any time to receive information about your personal data stored by us. You also have the right to rectification, deletion, or restriction of the processing of your personal data.',
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

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PrivacyPageContent />
    </Suspense>
  )
}

