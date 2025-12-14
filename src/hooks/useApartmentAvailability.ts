'use client'

import { useEffect, useState } from 'react'
import { BookedRange } from '@/lib/availability'
import { Apartment } from '@/data/apartments'

type AvailabilityMap = Record<string, BookedRange[]>

/**
 * Hook to fetch availability for multiple apartments
 */
export function useApartmentAvailability(
  apartments: Apartment[],
  checkIn: string | null,
  checkOut: string | null
) {
  const [availabilityMap, setAvailabilityMap] = useState<AvailabilityMap>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!checkIn || !checkOut || apartments.length === 0) {
      setAvailabilityMap({})
      return
    }

    async function fetchAllAvailability() {
      setLoading(true)
      try {
        const promises = apartments.map(async (apt) => {
          try {
            const response = await fetch(`/api/availability?slug=${apt.slug}`)
            if (response.ok) {
              const data = await response.json()
              return { slug: apt.slug, bookedRanges: data.bookedRanges || [] }
            }
            return { slug: apt.slug, bookedRanges: [] }
          } catch (error) {
            console.error(`Failed to fetch availability for ${apt.slug}:`, error)
            return { slug: apt.slug, bookedRanges: [] }
          }
        })

        const results = await Promise.all(promises)
        const map: AvailabilityMap = {}
        results.forEach((result) => {
          map[result.slug] = result.bookedRanges
        })
        setAvailabilityMap(map)
      } catch (error) {
        console.error('Error fetching availability:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllAvailability()
  }, [apartments, checkIn, checkOut])

  return { availabilityMap, loading }
}

