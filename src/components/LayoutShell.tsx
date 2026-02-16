'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'

/**
 * Conditionally renders the public-site Header + Footer.
 * Backoffice and admin routes get a bare shell (they have their own layouts).
 */
export default function LayoutShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isBareRoute =
    pathname.startsWith('/backoffice') || pathname.startsWith('/admin')

  if (isBareRoute) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
