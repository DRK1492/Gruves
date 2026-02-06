'use client'

type ViewMode = 'table' | 'grid' | 'tabs'

interface ViewModeToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

const options: Array<{ value: ViewMode; label: string }> = [
  { value: 'table', label: 'List' },
  { value: 'grid', label: 'Tiles' },
  { value: 'tabs', label: 'Columns' }
]

export default function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? 'view-toggle-active' : ''}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
