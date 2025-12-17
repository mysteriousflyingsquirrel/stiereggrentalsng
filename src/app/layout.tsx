import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StartupLoader from '@/components/StartupLoader'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stieregg Rentals - Holiday Apartments in Grindelwald',
  description: 'Holiday apartments in Grindelwald, Switzerland',
  icons: {
    icon: '/icons/logo_white_dark.svg',
    shortcut: '/icons/logo_white_dark.svg',
    apple: '/icons/logo_white_dark.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StartupLoader />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}

