'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'
import SectionTitle from '@/components/SectionTitle'

function AboutPageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  const content = {
    de: {
      title: 'Über uns',
      sections: [
        {
          title: 'Willkommen bei Stieregg Rentals',
          text: 'Wir bieten luxuriöse Ferienwohnungen in der wunderschönen Bergwelt von Grindelwald. Unsere Apartments verbinden alpine Eleganz mit modernem Komfort und bieten unvergessliche Aufenthalte für unsere Gäste.',
        },
        {
          title: 'Unsere Mission',
          text: 'Unser Ziel ist es, Ihnen einen außergewöhnlichen Aufenthalt in den Schweizer Alpen zu bieten. Wir legen großen Wert auf Qualität, Komfort und persönlichen Service.',
        },
        {
          title: 'Grindelwald',
          text: 'Grindelwald ist eines der bekanntesten Bergdörfer der Schweiz und bietet das ganze Jahr über unvergessliche Erlebnisse. Von Skifahren im Winter bis hin zu Wandern und Bergsteigen im Sommer - hier ist für jeden etwas dabei.',
        },
      ],
    },
    en: {
      title: 'About Us',
      sections: [
        {
          title: 'Welcome to Stieregg Rentals',
          text: 'We offer luxurious holiday apartments in the beautiful mountain world of Grindelwald. Our apartments combine alpine elegance with modern comfort and provide unforgettable stays for our guests.',
        },
        {
          title: 'Our Mission',
          text: 'Our goal is to provide you with an exceptional stay in the Swiss Alps. We place great emphasis on quality, comfort, and personal service.',
        },
        {
          title: 'Grindelwald',
          text: 'Grindelwald is one of the most famous mountain villages in Switzerland and offers unforgettable experiences all year round. From skiing in winter to hiking and mountaineering in summer - there is something for everyone here.',
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
            <p className="text-gray-700 leading-relaxed">{section.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AboutPageContent />
    </Suspense>
  )
}

