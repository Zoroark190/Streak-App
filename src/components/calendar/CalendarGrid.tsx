import { DateTime } from 'luxon'
import { CalendarDayCell } from './CalendarDayCell'
import { now, TIMEZONE } from '../../lib/time'
import type { DayValue } from '../../lib/calendarFirestore'

interface CalendarGridProps {
  year: number
  month: number
  entries: Record<string, DayValue>
  onDayClick: (day: number, newValue: DayValue) => void
  isJames: boolean
}

const DAYS_PER_ROW = 4 // Easily adjustable

export function CalendarGrid({ year, month, entries, onDayClick, isJames }: CalendarGridProps) {
  const daysInMonth = DateTime.local(year, month).daysInMonth ?? 30
  const today = now()

  const isClickable = (day: number): boolean => {
    if (!isJames) return false // Only primary user can click

    const dayDt = DateTime.local(year, month, day).setZone(TIMEZONE)
    const todayStart = today.startOf('day')

    // Only past days are clickable (before today)
    return dayDt < todayStart
  }

  const getDayValue = (day: number): DayValue => {
    return (entries[String(day)] as DayValue) ?? -1
  }

  const getNextValue = (current: DayValue): DayValue => {
    // Cycle: White(-1) -> Green(0) -> Red(1) -> Dark Red(2) -> White(-1)
    const cycle: DayValue[] = [-1, 0, 1, 2]
    const currentIndex = cycle.indexOf(current)
    return cycle[(currentIndex + 1) % cycle.length]
  }

  const handleDayClick = (day: number) => {
    if (!isClickable(day)) return
    const currentValue = getDayValue(day)
    const nextValue = getNextValue(currentValue)
    onDayClick(day, nextValue)
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${DAYS_PER_ROW}, 1fr)` }}
    >
      {days.map((day) => (
        <CalendarDayCell
          key={day}
          day={day}
          value={getDayValue(day)}
          isClickable={isClickable(day)}
          onClick={() => handleDayClick(day)}
        />
      ))}
    </div>
  )
}
