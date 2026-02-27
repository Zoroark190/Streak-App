import { useState } from 'react'
import { DateTime } from 'luxon'
import { updateConfig, setMonthAnchor } from '../lib/firestore'
import { updateMLConfig } from '../lib/mlFirestore'
import { TIMEZONE } from '../lib/time'

interface SettingsPanelProps {
  dailyTargetHours: number
  holidayExclusionsEnabled: boolean
  isJames: boolean
  mlWeeklyTargetHours?: number
}

export function SettingsPanel({
  dailyTargetHours,
  holidayExclusionsEnabled,
  isJames,
  mlWeeklyTargetHours = 20,
}: SettingsPanelProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlockInput, setUnlockInput] = useState('')
  const [targetHours, setTargetHours] = useState(dailyTargetHours)
  const [holidays, setHolidays] = useState(holidayExclusionsEnabled)
  const [mlTargetHours, setMlTargetHours] = useState(mlWeeklyTargetHours)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [resetting, setResetting] = useState(false)
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleUnlockAttempt = () => {
    if (unlockInput.toUpperCase() === 'UNLOCK') {
      setUnlocked(true)
      setShowUnlockModal(false)
      setUnlockInput('')
    }
  }

  const handleResetAnchors = async () => {
    setResetting(true)
    setResetStatus('idle')
    try {
      const todayAms = DateTime.now().setZone(TIMEZONE).startOf('day')
      await setMonthAnchor(todayAms.toISO()!)
      await updateMLConfig({ mlWeekStartAnchor: todayAms.toISODate()! })
      setResetStatus('success')
      setTimeout(() => setResetStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to reset anchors:', err)
      setResetStatus('error')
    } finally {
      setResetting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveStatus('idle')
    try {
      await updateConfig({
        dailyTargetHours: targetHours,
        holidayExclusionsEnabled: holidays,
      })
      await updateMLConfig({
        mlWeeklyTargetHours: mlTargetHours,
      })
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
      setSaveStatus('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Settings</h3>

      {!unlocked ? (
        <div className="text-center">
          <button
            onClick={() => setShowUnlockModal(true)}
            disabled={!isJames}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Unlock Settings
          </button>
          {!isJames && (
            <p className="text-xs text-gray-500 mt-2">Settings can only be changed by the primary user</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-xs text-yellow-800">
              Changing target hours recalculates expected hours for the entire current month period.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Daily Target Hours
            </label>
            <input
              type="number"
              value={targetHours}
              onChange={(e) => setTargetHours(parseFloat(e.target.value) || 0)}
              step="0.5"
              min="0"
              max="24"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-app-blue focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="holidays"
              checked={holidays}
              onChange={(e) => setHolidays(e.target.checked)}
              className="h-4 w-4 text-app-blue rounded"
            />
            <label htmlFor="holidays" className="text-sm text-gray-700">
              Exclude holidays (Dec 25, Jan 1)
            </label>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">ML Learning Settings</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Target Hours
              </label>
              <input
                type="number"
                value={mlTargetHours}
                onChange={(e) => setMlTargetHours(parseFloat(e.target.value) || 0)}
                step="0.5"
                min="0"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-app-blue focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-app-blue text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveStatus === 'success' && (
            <p className="text-sm text-green-600 text-center">Settings saved!</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-sm text-red-600 text-center">Failed to save. Try again.</p>
          )}

          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Reset Period Anchors</p>
            <p className="text-xs text-gray-500 mb-3">
              Sets today as the start of the current University month period and ML week. Existing session data is kept.
            </p>
            <button
              onClick={handleResetAnchors}
              disabled={resetting}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {resetting ? 'Resetting...' : 'Reset Anchors to Today'}
            </button>
            {resetStatus === 'success' && (
              <p className="text-sm text-green-600 text-center mt-2">Anchors reset to today!</p>
            )}
            {resetStatus === 'error' && (
              <p className="text-sm text-red-600 text-center mt-2">Failed to reset. Try again.</p>
            )}
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h4 className="text-lg font-bold text-gray-900 mb-2">Unlock Settings</h4>
            <p className="text-sm text-gray-600 mb-4">
              Type <strong>UNLOCK</strong> to confirm you want to edit settings.
            </p>
            <input
              type="text"
              value={unlockInput}
              onChange={(e) => setUnlockInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlockAttempt()}
              placeholder="Type UNLOCK"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-app-blue focus:border-transparent"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowUnlockModal(false); setUnlockInput('') }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlockAttempt}
                className="flex-1 bg-app-blue text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
