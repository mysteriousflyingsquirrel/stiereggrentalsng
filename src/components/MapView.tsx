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
function createCustomIcon(isFocused: boolean = false) {
  if (typeof window === 'undefined') return null
  
  const L = require('leaflet')
  const size = isFocused ? 40 : 32
  const height = isFocused ? 50 : 40
  const fillColor = isFocused ? '#DC2626' : '#273646' // Red for focused, dark gray for others
  
  const iconHtml = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${height}px;
    ">
      <svg width="${size}" height="${height}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C10.477 0 6 4.477 6 10C6 16 16 28 16 28C16 28 26 16 26 10C26 4.477 21.523 0 16 0Z" fill="${fillColor}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="10" r="4" fill="white"/>
      </svg>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
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
  const [focusedIcon, setFocusedIcon] = useState<any>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Create icons only on client side
    if (typeof window !== 'undefined') {
      setCustomIcon(createCustomIcon(false))
      setFocusedIcon(createCustomIcon(true))
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
  }, [])

  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }

  // Calculate center as midpoint of bounding box (middle of min/max lat/lng)
  let center: [number, number] = [46.6244, 8.0344] // Default fallback

  if (apartments.length > 0) {
    const lats = apartments.map(apt => apt.location.lat)
    const lngs = apartments.map(apt => apt.location.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    center = [(minLat + maxLat) / 2, (minLng + maxLng) / 2]
  }

  return (
    <div className={`w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-lg ${className}`}>
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={false} // Disable mouse wheel zoom for desktop users
        dragging={!isTouchDevice} // On touch devices, disable one-finger drag; use controls/pinch instead
        style={{ height: '100%', width: '100%' }}
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
            icon={isFocused ? focusedIcon : customIcon}
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

