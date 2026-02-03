import type { DayValue } from '../../lib/calendarFirestore'

interface CalendarDayCellProps {
  day: number
  value: DayValue
  isClickable: boolean
  onClick: () => void
}

const VALUE_COLORS: Record<DayValue, string> = {
  [-1]: 'bg-white border border-gray-200',
  [0]: 'bg-app-green text-white',
  [1]: 'bg-app-red text-white',
  [2]: 'bg-red-900 text-white',
}

export function CalendarDayCell({ day, value, isClickable, onClick }: CalendarDayCellProps) {
  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        aspect-square rounded-lg flex items-center justify-center
        text-lg font-medium transition-colors
        ${VALUE_COLORS[value]}
        ${isClickable
          ? 'cursor-pointer hover:opacity-80 active:scale-95'
          : 'cursor-default'
        }
      `}
    >
      {day}
    </button>
  )
}
