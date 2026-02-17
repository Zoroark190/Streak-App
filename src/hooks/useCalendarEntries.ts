import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToCalendarMonth,
  updateCalendarDay,
  type DayCheckboxes,
} from '../lib/calendarFirestore'

export interface CalendarEntriesState {
  entries: Record<string, DayCheckboxes>
  loading: boolean
  updateDay: (day: number, checkboxes: DayCheckboxes) => Promise<void>
}

export function useCalendarEntries(year: number, month: number): CalendarEntriesState {
  const [entries, setEntries] = useState<Record<string, DayCheckboxes>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToCalendarMonth(year, month, (data) => {
      setEntries(data.entries)
      setLoading(false)
    })

    return () => {
      unsubscribe()
    }
  }, [year, month])

  const updateDay = useCallback(
    async (day: number, checkboxes: DayCheckboxes) => {
      await updateCalendarDay(year, month, day, checkboxes)
    },
    [year, month]
  )

  return { entries, loading, updateDay }
}
