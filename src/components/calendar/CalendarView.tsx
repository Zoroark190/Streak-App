import { useState } from 'react'
import { useCalendarEntries } from '../../hooks/useCalendarEntries'
import { CalendarHeader } from './CalendarHeader'
import { CalendarGrid } from './CalendarGrid'
import { now } from '../../lib/time'
import type { DayValue } from '../../lib/calendarFirestore'

interface CalendarViewProps {
  isJames: boolean
}

export function CalendarView({ isJames }: CalendarViewProps) {
  const today = now()
  const [selectedYear, setSelectedYear] = useState(today.year)
  const [selectedMonth, setSelectedMonth] = useState(today.month)

  const { entries, loading, updateDay } = useCalendarEntries(selectedYear, selectedMonth)

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedYear(selectedYear - 1)
      setSelectedMonth(12)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleDayClick = async (day: number, newValue: DayValue) => {
    try {
      await updateDay(day, newValue)
    } catch (err) {
      console.error('Failed to update calendar day:', err)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <CalendarHeader
        year={selectedYear}
        month={selectedMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-app-blue"></div>
        </div>
      ) : (
        <CalendarGrid
          year={selectedYear}
          month={selectedMonth}
          entries={entries}
          onDayClick={handleDayClick}
          isJames={isJames}
        />
      )}

      {!isJames && (
        <p className="text-sm text-gray-500 text-center mt-4">View only - actions not available</p>
      )}
    </div>
  )
}
