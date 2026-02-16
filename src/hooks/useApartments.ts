import { useState, useEffect } from 'react'
import type { Apartment } from '@/data/apartments'
import { fetchApartments, fetchApartmentBySlug } from '@/lib/apartmentService'

/**
 * Hook to fetch all apartments from Firestore.
 */
export function useApartments() {
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    fetchApartments()
      .then((data) => {
        if (!cancelled) setApartments(data)
      })
      .catch((err) => {
        console.error('Failed to fetch apartments:', err)
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { apartments, loading, error }
}

/**
 * Hook to fetch a single apartment by slug from Firestore.
 */
export function useApartment(slug: string) {
  const [apartment, setApartment] = useState<Apartment | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }

    let cancelled = false

    fetchApartmentBySlug(slug)
      .then((data) => {
        if (!cancelled) setApartment(data)
      })
      .catch((err) => {
        console.error('Failed to fetch apartment:', err)
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  return { apartment, loading, error }
}
