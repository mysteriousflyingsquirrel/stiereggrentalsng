'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'

// Force dynamic rendering since we use useSearchParams
export const dynamic = 'force-dynamic'

function AboutPageContent() {
  const searchParams = useSearchParams()
  const locale = getLocaleFromSearchParams(searchParams)

  const content = {
    de: {
      title: 'Über uns',
      sections: [
        {
          title: 'Über uns',
          paragraphs: [
            'Wir sind ein familiengeführtes Unternehmen mit Sitz im Herzen von Grindelwald, Schweiz. Nach 27 Jahren Erfahrung in der Vermietung von Ferienwohnungen haben wir 2025 Stieregg Rentals gegründet, um unsere Leidenschaft für Gastfreundschaft in ein eigenes Unternehmen zu bringen.',
            'Unser Ziel ist es, Ihnen nicht nur eine Unterkunft, sondern ein unvergessliches Urlaubserlebnis zu bieten. Mit viel Herzblut und persönlichem Engagement kümmern wir uns um jede Buchung – individuell und mit echter Gastfreundschaft.',
            'Unsere liebevoll eingerichteten Apartments vereinen Komfort, Stil und die alpine Atmosphäre Grindelwalds – perfekt für entspannte Ferientage oder aktive Abenteuer. Bei uns sollen Sie sich vom ersten Moment an wie zu Hause fühlen.',
          ],
        },
        {
          title: 'Für Eigentümer',
          paragraphs: [
            'Wir bieten Verwaltungsdienste für Ferienwohnungen an. Unser Unternehmen übernimmt den kompletten Service, einschließlich Gästekommunikation, Check-in/Check-out und Reinigung. Ihre Immobilie wird auf diversen Plattformen gelistet, um maximale Sichtbarkeit und Buchungen zu erzielen. Wenn Sie interessiert sind, kontaktieren Sie uns, um mehr zu erfahren.',
            'Durch eine Partnerschaft mit uns können Eigentümer eine stressfreie Erfahrung genießen und gleichzeitig ihre Mieteinnahmen maximieren. Wir kümmern uns um alles, von der Vermarktung bis zu Gästebewertungen, und sorgen dafür, dass Ihre Immobilie gut gepflegt und hoch bewertet wird.',
          ],
        },
      ],
    },
    en: {
      title: 'About Us',
      sections: [
        {
          title: 'About Us',
          paragraphs: [
            'We are a family-run business located in the heart of Grindelwald, Switzerland. After 27 years of experience in vacation rental management, we founded Stieregg Rentals in 2025 to bring our passion for hospitality to life through our own company.',
            'Our goal is to offer more than just a place to stay – we aim to create unforgettable holiday experiences. With genuine care and personal attention, we treat every booking with a warm, individual touch.',
            'Our thoughtfully designed apartments combine comfort, style, and the alpine charm of Grindelwald – ideal for both relaxing escapes and mountain adventures. From the moment you arrive, we want you to feel right at home.',
          ],
        },
        {
          title: 'For Property Owners',
          paragraphs: [
            'We offer property management services for holiday apartments. Our company provides full service, including guest communication, check-in/check-out, and cleaning. Your property will be listed on various platforms to maximize visibility and bookings. If you\'re interested, contact us to learn more.',
            'By partnering with us, property owners can enjoy a hassle-free experience while maximizing their rental income. We handle everything from marketing to guest reviews, ensuring your property is well-maintained and highly rated.',
          ],
        },
      ],
    },
  }

  const pageContent = content[locale]

  const contactInfo = {
    de: {
      title: 'Kontaktieren Sie uns',
      email: 'E-Mail:',
      phone: 'Telefon:',
      location: 'Standort:',
      emailValue: 'info@stieregg.ch',
      phoneValue: '+41 79 768 39 73',
      locationValue: 'Grindelwald, Schweiz',
    },
    en: {
      title: 'Contact Us',
      email: 'Email:',
      phone: 'Phone:',
      location: 'Location:',
      emailValue: 'info@stieregg.ch',
      phoneValue: '+41 79 768 39 73',
      locationValue: 'Grindelwald, Switzerland',
    },
  }

  const contact = contactInfo[locale]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl space-y-8">
        {pageContent.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
            {section.paragraphs.map((paragraph, pIndex) => (
              <p key={pIndex} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
        
        {/* Contact Information */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{contact.title}</h2>
          <div className="space-y-3 text-gray-700">
            <div>
              <span className="font-medium">{contact.email}</span>{' '}
              <a href={`mailto:${contact.emailValue}`} className="text-accent hover:text-accent-dark transition-colors">
                {contact.emailValue}
              </a>
            </div>
            <div>
              <span className="font-medium">{contact.phone}</span>{' '}
              <a href={`tel:${contact.phoneValue.replace(/\s/g, '')}`} className="text-accent hover:text-accent-dark transition-colors">
                {contact.phoneValue}
              </a>
            </div>
            <div>
              <span className="font-medium">{contact.location}</span>{' '}
              <span>{contact.locationValue}</span>
            </div>
          </div>
        </div>
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

