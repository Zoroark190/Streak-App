import type { DayCheckboxes } from '../../lib/calendarFirestore'

interface CalendarDropdownProps {
  day: number
  checkboxes: DayCheckboxes
  autoTicks: { ml: boolean; uni: boolean }
  onChange: (updated: DayCheckboxes) => void
}

const CHECKBOX_ITEMS: Array<{ key: keyof DayCheckboxes; label: string }> = [
  { key: 'reading', label: 'Reading (40+ min)' },
  { key: 'gym', label: 'Gym (45+ min)' },
  { key: 'called', label: 'Called' },
  { key: 'ml', label: 'ML (1+ h)' },
  { key: 'uni', label: 'Uni (8+ h)' },
  { key: 'n', label: 'N' },
]

export function CalendarDropdown({ day, checkboxes, autoTicks, onChange }: CalendarDropdownProps) {
  const handleToggle = (key: keyof DayCheckboxes) => {
    onChange({ ...checkboxes, [key]: !checkboxes[key] })
  }

  return (
    <div className="mt-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
      <p className="text-sm font-semibold text-gray-700 mb-2">Day {day}</p>
      <div className="space-y-2">
        {CHECKBOX_ITEMS.map(({ key, label }) => {
          const isAuto = (key === 'ml' && autoTicks.ml) || (key === 'uni' && autoTicks.uni)

          return (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checkboxes[key]}
                onChange={() => handleToggle(key)}
                className="w-5 h-5 rounded border-gray-300 text-app-blue focus:ring-app-blue"
              />
              <span className="text-sm text-gray-800">{label}</span>
              {isAuto && (
                <span className="text-xs text-app-blue bg-blue-50 px-1.5 py-0.5 rounded">
                  auto
                </span>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}
