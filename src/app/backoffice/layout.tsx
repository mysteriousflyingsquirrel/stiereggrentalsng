'use client'

/**
 * Backoffice layout – sidebar + auth guard.
 *
 * ⚠️ SECURITY NOTE (MVP):
 * The route guard here is client-side only. Firestore / Storage security
 * rules and/or Firebase custom claims should be used for production-grade
 * access control. This layout simply prevents the UI from rendering for
 * unauthenticated or non-allowlisted users.
 */

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAdminAuth, signOutAdmin } from '@/lib/adminAuth'

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isAdmin, loading } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace('/admin/login')
      return
    }

    // Logged in but NOT allow-listed → sign out and redirect
    if (!isAdmin) {
      signOutAdmin().then(() => router.replace('/admin/login'))
    }
  }, [user, isAdmin, loading, router])

  const handleLogout = async () => {
    await signOutAdmin()
    router.replace('/')
  }

  // Resolving auth state – minimal loader, no flicker
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading…</p>
      </div>
    )
  }

  // Not authorized – will redirect via useEffect; show nothing
  if (!isAdmin) return null

  const navItems = [
    { href: '/backoffice/calendar', label: 'Calendar' },
    { href: '/backoffice/apartments', label: 'Apartments' },
    { href: '/backoffice/seasons', label: 'Seasons' },
  ]

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-accent text-white flex flex-col shadow-xl">
        <div className="px-6 py-5 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-wide">Backoffice</h1>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
