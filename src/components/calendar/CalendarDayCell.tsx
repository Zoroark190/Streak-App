import { calculateDayScore, type DayCheckboxes } from '../../lib/calendarFirestore'

interface CalendarDayCellProps {
  day: number
  checkboxes: DayCheckboxes
  isClickable: boolean
  isSelected: boolean
  isPast: boolean
  onClick: () => void
}

function getColorForScore(score: number): string {
  switch (score) {
    case -1: return 'bg-red-950 text-white'
    case 0:  return 'bg-red-800 text-white'
    case 1:  return 'bg-red-500 text-white'
    case 2:  return 'bg-red-300 text-red-900'
    case 3:  return 'bg-orange-400 text-white'
    case 4:  return 'bg-green-700 text-white'
    case 5:  return 'bg-green-400 text-white'
    default: return 'bg-white border border-gray-200'
  }
}

export function CalendarDayCell({ day, checkboxes, isClickable, isSelected, isPast, onClick }: CalendarDayCellProps) {
  const score = calculateDayScore(checkboxes)
  const hasData = Object.values(checkboxes).some(Boolean)
  const colorClass = (isPast || hasData) ? getColorForScore(score) : 'bg-white border border-gray-200'
  const selectedRing = isSelected ? 'ring-2 ring-app-blue ring-offset-2' : ''

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={`
        aspect-square rounded-lg flex items-center justify-center
        text-lg font-medium transition-colors
        ${colorClass}
        ${selectedRing}
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
