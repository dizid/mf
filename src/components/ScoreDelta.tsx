interface ScoreDeltaProps {
  current: number
  previous: number | null
  size?: 'small' | 'large'
}

export function ScoreDelta({ current, previous, size = 'small' }: ScoreDeltaProps) {
  // No previous evaluation - show NEW badge
  if (previous === null) {
    return (
      <span className={`inline-flex items-center rounded-full bg-blue-100 text-blue-700 font-medium ${
        size === 'large' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
      }`}>
        NEW
      </span>
    )
  }

  const delta = current - previous

  // No significant change
  if (Math.abs(delta) < 0.1) {
    return (
      <span className={`inline-flex items-center text-gray-400 ${
        size === 'large' ? 'text-base' : 'text-sm'
      }`}>
        <span className="mr-0.5">=</span>
        <span>0.0</span>
      </span>
    )
  }

  const isPositive = delta > 0

  return (
    <span className={`inline-flex items-center font-medium ${
      isPositive ? 'text-success' : 'text-danger'
    } ${size === 'large' ? 'text-base' : 'text-sm'}`}>
      {/* Arrow */}
      <svg
        className={`${size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} mr-0.5 ${
          isPositive ? '' : 'rotate-180'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
      {/* Delta value */}
      <span>{isPositive ? '+' : ''}{delta.toFixed(1)}</span>
    </span>
  )
}
