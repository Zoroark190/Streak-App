export type TabType = 'university' | 'ml' | 'calendar'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex">
        <button
          onClick={() => onTabChange('university')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'university'
              ? 'text-app-blue border-b-2 border-app-blue bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          University Sign-In
        </button>
        <button
          onClick={() => onTabChange('ml')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'ml'
              ? 'text-app-blue border-b-2 border-app-blue bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          ML Learning
        </button>
        <button
          onClick={() => onTabChange('calendar')}
          className={`flex-1 py-3 text-center font-semibold transition-colors ${
            activeTab === 'calendar'
              ? 'text-app-blue border-b-2 border-app-blue bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          Calendar
        </button>
      </div>
    </div>
  )
}
