import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-label font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full min-h-input px-4 text-body rounded-xl border-2
            bg-white text-gray-900 placeholder-gray-400
            focus:outline-none focus:border-primary focus:ring-0
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-danger' : 'border-gray-200'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-label text-danger">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
