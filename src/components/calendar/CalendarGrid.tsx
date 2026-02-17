import { useState } from 'react'
import { DateTime } from 'luxon'
import { CalendarDayCell } from './CalendarDayCell'
import { CalendarDropdown } from './CalendarDropdown'
import { now, TIMEZONE } from '../../lib/time'
import { DEFAULT_CHECKBOXES, type DayCheckboxes } from '../../lib/calendarFirestore'
import { computeAutoTicks } from '../../lib/calendarCalculations'
import type { Session } from '../../lib/calculations'
import type { MLSession } from '../../lib/mlFirestore'

interface CalendarGridProps {
  year: number
  month: number
  entries: Record<string, DayCheckboxes>
  onDayUpdate: (day: number, checkboxes: DayCheckboxes) => void
  isJames: boolean
  sessions: Session[]
  mlSessions: MLSession[]
}

const DAYS_PER_ROW = 4 // Easily adjustable

export function CalendarGrid({ year, month, entries, onDayUpdate, isJames, sessions, mlSessions }: CalendarGridProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const daysInMonth = DateTime.local(year, month).daysInMonth ?? 30
  const today = now()

  const isPastOrToday = (day: number): boolean => {
    const dayDt = DateTime.local(year, month, day).setZone(TIMEZONE).startOf('day')
    const todayStart = today.startOf('day')
    return dayDt <= todayStart
  }

  const isClickable = (_day: number): boolean => {
    return isJames
  }

  const getIsoDate = (day: number): string => {
    return DateTime.local(year, month, day).setZone(TIMEZONE).toISODate()!
  }

  const getDayCheckboxes = (day: number): DayCheckboxes => {
    const stored = entries[String(day)]
    if (stored) return stored

    // No stored entry: compute auto-tick defaults
    const autoTicks = computeAutoTicks(sessions, mlSessions, getIsoDate(day))
    return {
      ...DEFAULT_CHECKBOXES,
      ml: autoTicks.ml,
      uni: autoTicks.uni,
    }
  }

  const getAutoTicks = (day: number): { ml: boolean; uni: boolean } => {
    return computeAutoTicks(sessions, mlSessions, getIsoDate(day))
  }

  const handleDayClick = (day: number) => {
    if (!isClickable(day)) return
    setSelectedDay(selectedDay === day ? null : day)
  }

  // Split days into rows
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const rows: number[][] = []
  for (let i = 0; i < days.length; i += DAYS_PER_ROW) {
    rows.push(days.slice(i, i + DAYS_PER_ROW))
  }

  return (
    <div className="space-y-2">
      {rows.map((rowDays, rowIndex) => (
        <div key={rowIndex}>
          {/* Day cells row */}
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${DAYS_PER_ROW}, 1fr)` }}
          >
            {rowDays.map((day) => (
              <CalendarDayCell
                key={day}
                day={day}
                checkboxes={getDayCheckboxes(day)}
                isClickable={isClickable(day)}
                isSelected={selectedDay === day}
                isPast={isPastOrToday(day)}
                onClick={() => handleDayClick(day)}
              />
            ))}
          </div>

          {/* Dropdown if a day in this row is selected */}
          {selectedDay !== null && rowDays.includes(selectedDay) && (
            <CalendarDropdown
              day={selectedDay}
              checkboxes={getDayCheckboxes(selectedDay)}
              autoTicks={getAutoTicks(selectedDay)}
              onChange={(newCheckboxes) => onDayUpdate(selectedDay, newCheckboxes)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
