export type Locale = 'de' | 'en'

export const defaultLocale: Locale = 'de'
export const supportedLocales: Locale[] = ['de', 'en']

export function getLocaleFromSearchParams(searchParams: URLSearchParams): Locale {
  const lang = searchParams.get('lang')
  if (lang === 'de' || lang === 'en') {
    return lang
  }
  return defaultLocale
}

export function getLocaleFromPathname(pathname: string): Locale {
  if (pathname.startsWith('/en')) {
    return 'en'
  }
  if (pathname.startsWith('/de')) {
    return 'de'
  }
  return defaultLocale
}

