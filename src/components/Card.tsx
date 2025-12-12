import { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  const baseStyles =
    'bg-white rounded-2xl shadow-lg overflow-hidden'
  const hoverStyles = hover
    ? 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-1'
    : ''

  return (
    <div className={`${baseStyles} ${hoverStyles} ${className}`}>
      {children}
    </div>
  )
}

