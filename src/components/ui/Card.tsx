import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'bg-white rounded-xl shadow-sm'

    const variants = {
      default: 'p-4',
      interactive: 'p-4 active:bg-gray-50 cursor-pointer',
    }

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
