import Link from 'next/link'
import Button from '@/components/Button'

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Button href="/" variant="primary">
        Go back home
      </Button>
    </div>
  )
}

