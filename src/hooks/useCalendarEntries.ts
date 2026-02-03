import { useState, useEffect, useCallback } from 'react'
import {
  subscribeToCalendarMonth,
  updateCalendarDay,
  type DayValue,
} from '../lib/calendarFirestore'

export interface CalendarEntriesState {
  entries: Record<string, DayValue>
  loading: boolean
  updateDay: (day: number, value: DayValue) => Promise<void>
}

export function useCalendarEntries(year: number, month: number): CalendarEntriesState {
  const [entries, setEntries] = useState<Record<string, DayValue>>({})
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
    async (day: number, value: DayValue) => {
      await updateCalendarDay(year, month, day, value)
    },
    [year, month]
  )

  return { entries, loading, updateDay }
}
