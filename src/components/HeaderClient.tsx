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
    if (typeof window === 'undefined') return
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

  const isHomePage = pathname === '/'
  const isActive = (href: string) => pathname === href

  return (
    <header
      className={`${
        isHomePage
          ? 'absolute top-0 left-0 right-0 bg-transparent z-50'
          : 'bg-white shadow-md sticky top-0 z-50'
      }`}
    >
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href={getLocalizedPath('/')} className="flex items-center group">
            <div
              className={`relative transition-all duration-300 ${
                isHomePage
                  ? 'backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:scale-105'
                  : 'bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 shadow-md hover:shadow-lg hover:ring-2 hover:ring-accent transition-all'
              }`}
            >
              {isHomePage && (
                <>
                  {/* Main background - solid white */}
                  <div className="absolute inset-0 rounded-2xl bg-white/95"></div>
                  {/* Subtle border */}
                  <div className="absolute inset-0 rounded-2xl border border-white/30"></div>
                  {/* Hover accent overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/20 via-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
              )}
              <Image
                src="/icons/transparent_dark.svg"
                alt="Stieregg Rentals"
                width={180}
                height={60}
                className={`relative z-10 h-12 md:h-16 w-auto transition-transform duration-300 ${
                  isHomePage ? 'group-hover:scale-105' : ''
                }`}
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation + Language Switcher - Top Right */}
          <div className="hidden md:flex items-center gap-4">
            {/* Navigation Links */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLocalizedPath(link.href)}
                className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isHomePage
                    ? isActive(link.href)
                      ? 'text-white bg-white/15 backdrop-blur-sm'
                      : 'text-white/90 hover:text-white hover:bg-white/10 backdrop-blur-sm'
                    : isActive(link.href)
                    ? 'text-accent bg-accent/5'
                    : 'text-gray-700 hover:text-accent hover:bg-gray-100'
                }`}
              >
                <span className="relative z-10">{link.label[locale]}</span>
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-200 ${
                    isActive(link.href)
                      ? `w-8 ${isHomePage ? 'bg-white' : 'bg-accent'}`
                      : `w-0 group-hover:w-8 ${isHomePage ? 'bg-white' : 'bg-accent'}`
                  }`}
                  aria-hidden="true"
                ></span>
              </Link>
            ))}
            {/* Language Switcher - Compact Pill */}
            <div
              className={`flex items-center gap-0.5 rounded-full p-1 ${
                isHomePage
                  ? 'bg-white/10 backdrop-blur-md border border-white/20'
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              <button
                onClick={toggleLocale}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  locale === 'de'
                    ? isHomePage
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isHomePage
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label="Toggle to English"
              >
                <Image
                  src="/icons/de.png"
                  alt="Deutsch"
                  width={14}
                  height={14}
                  className="rounded-sm"
                />
                <span>DE</span>
              </button>
              <button
                onClick={toggleLocale}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  locale === 'en'
                    ? isHomePage
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'bg-white text-gray-900 shadow-sm'
                    : isHomePage
                    ? 'text-white/80 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                aria-label="Toggle to Deutsch"
              >
                <Image
                  src="/icons/en.png"
                  alt="English"
                  width={14}
                  height={14}
                  className="rounded-sm"
                />
                <span>EN</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg transition-all ${
              isHomePage
                ? 'text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20'
                : 'hover:bg-gray-100'
            }`}
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
          <div
            className={`md:hidden mt-4 pb-4 rounded-lg ${
              isHomePage
                ? 'bg-white/95 backdrop-blur-md border border-white/20 pt-4'
                : 'border-t pt-4'
            }`}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={getLocalizedPath(link.href)}
                className={`block py-2 px-2 rounded-lg transition-colors ${
                  isHomePage
                    ? 'text-gray-900 hover:bg-gray-100'
                    : 'text-gray-700 hover:text-accent'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label[locale]}
              </Link>
            ))}
            <div
              className={`flex items-center gap-1 rounded-lg w-full ${
                isHomePage
                  ? 'bg-white/10 backdrop-blur-sm border border-white/20 p-1'
                  : 'bg-gray-100 border border-gray-300 p-1'
              }`}
            >
              <button
                onClick={toggleLocale}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 flex-1 justify-center ${
                  locale === 'de'
                    ? isHomePage
                      ? 'bg-white/90 text-gray-900'
                      : 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Toggle to English"
              >
                <Image
                  src="/icons/de.png"
                  alt="Deutsch"
                  width={16}
                  height={16}
                />
                <span className="text-sm font-medium">DE</span>
              </button>
              <button
                onClick={toggleLocale}
                className={`flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-200 flex-1 justify-center ${
                  locale === 'en'
                    ? isHomePage
                      ? 'bg-white/90 text-gray-900'
                      : 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:text-gray-900'
                }`}
                aria-label="Toggle to Deutsch"
              >
                <Image
                  src="/icons/en.png"
                  alt="English"
                  width={16}
                  height={16}
                />
                <span className="text-sm font-medium">EN</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

