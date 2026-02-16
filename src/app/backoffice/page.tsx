'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** /backoffice → redirect to /backoffice/apartments */
export default function BackofficePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/backoffice/apartments')
  }, [router])

  return null
}
