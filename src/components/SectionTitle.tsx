import { ReactNode } from 'react'

type SectionTitleProps = {
  children: ReactNode
  className?: string
}

export default function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <h2 className={`text-3xl md:text-4xl font-bold text-gray-900 mb-8 ${className}`}>
      {children}
    </h2>
  )
}

