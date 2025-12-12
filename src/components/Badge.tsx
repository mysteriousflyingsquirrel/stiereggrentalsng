import { ReactNode } from 'react'

type BadgeProps = {
  children: ReactNode
  variant?: 'default' | 'accent'
  className?: string
}

export default function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    accent: 'bg-accent/10 text-accent-dark',
  }

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

