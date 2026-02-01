import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useConfig } from './hooks/useConfig'
import { useSessions } from './hooks/useSessions'
import { useMLSessions } from './hooks/useMLSessions'
import { SignInGate } from './components/SignInGate'
import { StartScreen } from './components/StartScreen'
import { CheckInCard } from './components/CheckInCard'
import { HoursGraph } from './components/HoursGraph'
import { ProgressStats } from './components/ProgressStats'
import { MonthlyGoal } from './components/MonthlyGoal'
import { SecondaryStats } from './components/SecondaryStats'
import { SessionList } from './components/SessionList'
import { SettingsPanel } from './components/SettingsPanel'
import { TabNavigation, type TabType } from './components/TabNavigation'
import { MLLearningCard } from './components/ml/MLLearningCard'
import { MLHoursGraph } from './components/ml/MLHoursGraph'
import { MLWeeklyGoal } from './components/ml/MLWeeklyGoal'
import { MLSessionList } from './components/ml/MLSessionList'

function AppContent({ isJames, onSignOut }: { isJames: boolean; onSignOut: () => Promise<void> }) {
  const [activeTab, setActiveTab] = useState<TabType>('university')
  const { config, loading: configLoading } = useConfig()
  const { sessions, openSession, loading: sessionsLoading } = useSessions()
  const { mlSessions, openMLSession, loading: mlLoading } = useMLSessions()

  if (configLoading || sessionsLoading || mlLoading) {
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
        {/* Tab Navigation - Always visible */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* University Sign-In Tab Content */}
        {activeTab === 'university' && (
          <>
            {/* Above the fold */}
            <CheckInCard openSession={openSession} isJames={isJames} />
            <HoursGraph sessions={sessions} anchorISO={config.monthStartAnchorDateTime} />
            <ProgressStats
              sessions={sessions}
              anchorISO={config.monthStartAnchorDateTime}
              dailyTargetHours={config.dailyTargetHours}
              holidayExclusionsEnabled={config.holidayExclusionsEnabled}
            />
            <MonthlyGoal
              sessions={sessions}
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
              mlWeeklyTargetHours={config.mlWeeklyTargetHours}
            />
          </>
        )}

        {/* ML Learning Tab Content */}
        {activeTab === 'ml' && (
          <>
            <MLLearningCard
              openMLSession={openMLSession}
              isJames={isJames}
              lastPageMathML={config.mlLastPageMathML}
              lastPageProbML={config.mlLastPageProbML}
              mlWeekStartAnchor={config.mlWeekStartAnchor}
            />
            <MLHoursGraph
              mlSessions={mlSessions}
              mlWeekStartAnchor={config.mlWeekStartAnchor}
            />
            <MLWeeklyGoal
              mlSessions={mlSessions}
              mlWeekStartAnchor={config.mlWeekStartAnchor}
              mlWeeklyTargetHours={config.mlWeeklyTargetHours}
            />
            <MLSessionList mlSessions={mlSessions} />
            <SettingsPanel
              dailyTargetHours={config.dailyTargetHours}
              holidayExclusionsEnabled={config.holidayExclusionsEnabled}
              isJames={isJames}
              mlWeeklyTargetHours={config.mlWeeklyTargetHours}
            />
          </>
        )}

        {/* Sign out button at the bottom */}
        <div className="text-center pt-4 pb-8">
          <button
            onClick={onSignOut}
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Sign Out
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
      <AppContent isJames={auth.isJames} onSignOut={auth.signOut} />
    </SignInGate>
  )
}
