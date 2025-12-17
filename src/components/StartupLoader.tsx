'use client'

import { useEffect, useState } from 'react'

export default function StartupLoader() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if device is mobile (screen width < 768px, which is Tailwind's md breakpoint)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    // Hide loader when page is fully loaded
    const handleLoad = () => {
      setTimeout(() => {
        setLoading(false)
      }, 300)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => {
        window.removeEventListener('load', handleLoad)
        window.removeEventListener('resize', checkMobile)
      }
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Only show on mobile devices
  if (!mounted || !loading || !isMobile) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-500 ease-out md:hidden"
      style={{ 
        opacity: loading ? 1 : 0,
        pointerEvents: loading ? 'auto' : 'none'
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="w-48 h-48 flex items-center justify-center">
          <img
            src="/icons/logo_white_dark.svg"
            alt="Stieregg Rentals Logo"
            className="w-full h-full object-contain"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}

