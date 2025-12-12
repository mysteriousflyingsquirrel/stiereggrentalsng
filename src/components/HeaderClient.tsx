'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, usePathname } from 'next/navigation'
import { getLocaleFromSearchParams } from '@/lib/locale'

export default function HeaderClient() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = getLocaleFromSearchParams(searchParams)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleLocale = () => {
    const newLocale = locale === 'de' ? 'en' : 'de'
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('lang', newLocale)
    const search = current.toString()
    const query = search ? `?${search}` : ''
    window.location.href = `${pathname}${query}`
  }

  const getLocalizedPath = (path: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()))
    current.set('lang', locale)
    const search = current.toString()
    return `${path}?${search}`
  }

  const navLinks = [
    { href: '/', label: { de: 'Startseite', en: 'Home' } },
    { href: '/about', label: { de: 'Über uns', en: 'About' } },
    { href: '/impressum', label: { de: 'Impressum', en: 'Legal' } },
    { href: '/privacy', label: { de: 'Datenschutz', en: 'Privacy' } },
  ]

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={getLocalizedPath('/')} className="flex items-center gap-2">
            <Image
              src="/icons/logo_white_dark.svg"
              alt="Stieregg Rentals"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              Stieregg Rentals
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLocalizedPath(link.href)}
                className="text-gray-700 hover:text-accent transition-colors font-medium"
              >
                {link.label[locale]}
              </Link>
            ))}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Image
                src={locale === 'de' ? '/icons/de.png' : '/icons/en.png'}
                alt={locale === 'de' ? 'Deutsch' : 'English'}
                width={20}
                height={20}
              />
              <span className="text-sm font-medium">{locale.toUpperCase()}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLocalizedPath(link.href)}
                className="block py-2 text-gray-700 hover:text-accent transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label[locale]}
              </Link>
            ))}
            <button
              onClick={toggleLocale}
              className="flex items-center gap-2 py-2 text-gray-700 hover:text-accent transition-colors"
            >
              <Image
                src={locale === 'de' ? '/icons/de.png' : '/icons/en.png'}
                alt={locale === 'de' ? 'Deutsch' : 'English'}
                width={20}
                height={20}
              />
              <span>{locale === 'de' ? 'English' : 'Deutsch'}</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}

