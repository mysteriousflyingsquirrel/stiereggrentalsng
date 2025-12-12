import { Suspense } from 'react'
import HeaderClient from './HeaderClient'

export default function Header() {
  return (
    <Suspense fallback={<div className="h-16 bg-white"></div>}>
      <HeaderClient />
    </Suspense>
  )
}

