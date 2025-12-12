import Link from 'next/link'
import { ReactNode } from 'react'

type ButtonProps = {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  external?: boolean
}

export default function Button({
  children,
  href,
  onClick,
  variant = 'primary',
  className = '',
  external = false,
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center px-6 py-3 rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl'
  const variants = {
    primary:
      'bg-accent text-white hover:bg-accent-dark active:scale-95',
    secondary:
      'bg-gray-800 text-white hover:bg-gray-700 active:scale-95',
    outline:
      'border-2 border-accent text-accent hover:bg-accent hover:text-white active:scale-95',
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${className}`

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClassName}
        >
          {children}
        </a>
      )
    }
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className={combinedClassName}>
      {children}
    </button>
  )
}

