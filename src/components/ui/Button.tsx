import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'default' | 'large'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'default', loading, disabled, children, ...props }, ref) => {
    const baseStyles = 'font-semibold rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-primary text-white active:bg-primary-dark focus-visible:ring-primary',
      secondary: 'bg-gray-100 text-gray-900 active:bg-gray-200 focus-visible:ring-gray-500',
      danger: 'bg-danger text-white active:bg-red-700 focus-visible:ring-danger',
    }

    const sizes = {
      default: 'min-h-touch px-6 text-body',
      large: 'min-h-[64px] px-8 text-lg w-full',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
