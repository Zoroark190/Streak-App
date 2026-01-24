import { useAuth } from './hooks/useAuth'
import { useConfig } from './hooks/useConfig'
import { useSessions } from './hooks/useSessions'
import { SignInGate } from './components/SignInGate'
import { StartScreen } from './components/StartScreen'
import { CheckInCard } from './components/CheckInCard'
import { ProgressStats } from './components/ProgressStats'
import { SecondaryStats } from './components/SecondaryStats'
import { SessionList } from './components/SessionList'
import { SettingsPanel } from './components/SettingsPanel'

function AppContent({ isJames }: { isJames: boolean }) {
  const { config, loading: configLoading } = useConfig()
  const { sessions, openSession, loading: sessionsLoading } = useSessions()

  if (configLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-app-blue"></div>
      </div>
    )
  }

  // Show Start screen if month anchor not initialized
  if (!config.monthStartAnchorDateTime) {
    return <StartScreen isJames={isJames} />
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Above the fold */}
        <CheckInCard openSession={openSession} isJames={isJames} />
        <ProgressStats
          sessions={sessions}
          openSession={openSession}
          anchorISO={config.monthStartAnchorDateTime}
          dailyTargetHours={config.dailyTargetHours}
          holidayExclusionsEnabled={config.holidayExclusionsEnabled}
        />

        {/* On scroll */}
        <SecondaryStats
          sessions={sessions}
          anchorISO={config.monthStartAnchorDateTime}
        />
        <SessionList sessions={sessions} />
        <SettingsPanel
          dailyTargetHours={config.dailyTargetHours}
          holidayExclusionsEnabled={config.holidayExclusionsEnabled}
          isJames={isJames}
        />

        {/* Sign out button at the bottom */}
        <div className="text-center pt-4 pb-8">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const auth = useAuth()

  return (
    <SignInGate auth={auth}>
      <AppContent isJames={auth.isJames} />
    </SignInGate>
  )
}
