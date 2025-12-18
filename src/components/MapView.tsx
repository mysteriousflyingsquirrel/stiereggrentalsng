'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Apartment } from '@/data/apartments'
import ApartmentMiniCard from './ApartmentMiniCard'
import { Locale } from '@/lib/locale'

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
})
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
})
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
})
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
})

// Create custom pin icon - only call when Leaflet is available
function createCustomIcon() {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  const iconHtml = `
    <div style="
      position: relative;
      width: 32px;
      height: 40px;
    ">
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C10.477 0 6 4.477 6 10C6 16 16 28 16 28C16 28 26 16 26 10C26 4.477 21.523 0 16 0Z" fill="#273646" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="10" r="4" fill="white"/>
      </svg>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  })
}

type MapViewProps = {
  apartments: Apartment[]
  locale: Locale
  className?: string
  focusedSlug?: string | null
}

export default function MapView({ apartments, locale, className = '', focusedSlug }: MapViewProps) {
  const [isClient, setIsClient] = useState(false)
  const [customIcon, setCustomIcon] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    // Create icon only on client side
    if (typeof window !== 'undefined') {
      setCustomIcon(createCustomIcon())
    }
  }, [])

  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }

  // Default center to Grindelwald
  let center: [number, number] = [46.6244, 8.0344]

  if (focusedSlug) {
    const focusedApartment = apartments.find((apt) => apt.slug === focusedSlug)
    if (focusedApartment) {
      center = [focusedApartment.location.lat, focusedApartment.location.lng]
    }
  }

  return (
    <div className={`w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-lg ${className}`}>
      <MapContainer
        center={center}
        zoom={focusedSlug ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {apartments.map((apartment) => {
          const isFocused = focusedSlug && apartment.slug === focusedSlug
          return (
          <Marker
            key={apartment.id}
            position={[apartment.location.lat, apartment.location.lng]}
            icon={customIcon}
            eventHandlers={
              isFocused
                ? {
                    add: (e) => {
                      // Open the popup automatically when this marker is added
                      e.target.openPopup()
                    },
                  }
                : undefined
            }
          >
            <Popup>
              <ApartmentMiniCard apartment={apartment} locale={locale} />
            </Popup>
          </Marker>
        )})}
      </MapContainer>
    </div>
  )
}

