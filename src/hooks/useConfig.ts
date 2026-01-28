import { useState, useEffect } from 'react'
import { subscribeToConfig, type AppConfig } from '../lib/firestore'

export interface ConfigState {
  config: AppConfig
  loading: boolean
}

export function useConfig(): ConfigState {
  const [config, setConfig] = useState<AppConfig>({
    monthStartAnchorDateTime: null,
    dailyTargetHours: 7.5,
    holidayExclusionsEnabled: true,
    mlWeeklyTargetHours: 20,
    mlWeekStartAnchor: null,
    mlLastPageMathML: 0,
    mlLastPageProbML: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  return { config, loading }
}
