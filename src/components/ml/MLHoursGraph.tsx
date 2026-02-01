import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { type MLSession } from '../../lib/mlFirestore'
import {
  type GraphViewMode,
  type GraphDataPoint,
  getMLGraphData,
} from '../../lib/mlGraphCalculations'

interface MLHoursGraphProps {
  mlSessions: MLSession[]
  mlWeekStartAnchor: string | null
}

export function MLHoursGraph({ mlSessions, mlWeekStartAnchor }: MLHoursGraphProps) {
  const [viewMode, setViewMode] = useState<GraphViewMode>('daily')

  // If no anchor, show placeholder
  if (!mlWeekStartAnchor) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Hours Trend</h3>
          <p className="text-gray-400">Start a session to begin tracking</p>
        </div>
      </div>
    )
  }

  const graphData = useMemo(() => {
    return getMLGraphData(mlSessions, viewMode, mlWeekStartAnchor)
  }, [mlSessions, viewMode, mlWeekStartAnchor])

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with title and toggle buttons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700">Hours Trend</h3>
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Graph container */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={graphData.points}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              domain={[0, 'auto']}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#1565C0"
              strokeWidth={2}
              dot={{ fill: '#1565C0', strokeWidth: 0, r: 4 }}
              activeDot={{ fill: '#1565C0', strokeWidth: 0, r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface ViewToggleProps {
  viewMode: GraphViewMode
  onChange: (mode: GraphViewMode) => void
}

function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  const modes: { value: GraphViewMode; label: string }[] = [
    { value: 'daily', label: 'D' },
    { value: 'weekly', label: 'W' },
    { value: 'monthly', label: 'M' },
  ]

  return (
    <div className="flex rounded-lg bg-gray-100 p-0.5">
      {modes.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            viewMode === value
              ? 'bg-white text-app-blue shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: GraphDataPoint }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
      <p className="text-xs text-gray-500">{data.fullLabel}</p>
      <p className="text-sm font-semibold text-gray-800">
        {data.hours.toFixed(1)} hours
      </p>
    </div>
  )
}
