import { DateTime } from 'luxon'

interface CalendarHeaderProps {
  year: number
  month: number
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function CalendarHeader({ year, month, onPrevMonth, onNextMonth }: CalendarHeaderProps) {
  const dt = DateTime.local(year, month)
  const monthName = dt.toFormat('LLLL yyyy') // "February 2026"

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={onPrevMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <h2 className="text-xl font-semibold text-gray-900">{monthName}</h2>

      <button
        onClick={onNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
