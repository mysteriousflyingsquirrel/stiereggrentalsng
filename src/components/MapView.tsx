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

type MapViewProps = {
  apartments: Apartment[]
  locale: Locale
  className?: string
}

export default function MapView({ apartments, locale, className = '' }: MapViewProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`w-full h-96 bg-gray-200 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="text-gray-400">Loading map...</div>
      </div>
    )
  }

  // Default center to Grindelwald
  const center: [number, number] = [46.6244, 8.0344]

  return (
    <div className={`w-full h-96 md:h-[500px] rounded-2xl overflow-hidden shadow-lg ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {apartments.map((apartment) => (
          <Marker
            key={apartment.id}
            position={[apartment.location.lat, apartment.location.lng]}
          >
            <Popup>
              <ApartmentMiniCard apartment={apartment} locale={locale} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

