import { useState, useEffect } from 'react'

interface MLEndSessionModalProps {
  onClose: () => void
  onFinish: (data: { pageMathML: number; pageProbML: number; notes: string | null }) => void
  onDiscard: () => void
  lastPageMathML: number
  lastPageProbML: number
  loading: boolean
}

export function MLEndSessionModal({
  onClose,
  onFinish,
  onDiscard,
  lastPageMathML,
  lastPageProbML,
  loading,
}: MLEndSessionModalProps) {
  const [pageMathML, setPageMathML] = useState('')
  const [pageProbML, setPageProbML] = useState('')
  const [notes, setNotes] = useState('')
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  // Pre-fill with last page numbers if available
  useEffect(() => {
    if (lastPageMathML > 0) {
      setPageMathML(lastPageMathML.toString())
    }
    if (lastPageProbML > 0) {
      setPageProbML(lastPageProbML.toString())
    }
  }, [lastPageMathML, lastPageProbML])

  const canFinish = pageMathML.trim() !== '' && pageProbML.trim() !== '' && !loading

  const handleFinish = () => {
    if (!canFinish) return

    onFinish({
      pageMathML: parseInt(pageMathML, 10),
      pageProbML: parseInt(pageProbML, 10),
      notes: notes.trim() || null,
    })
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    if (e.target.value.length > 0) {
      setShowPlaceholder(false)
    }
  }

  const handleNotesFocus = () => {
    setShowPlaceholder(false)
  }

  const handleNotesBlur = () => {
    if (notes.length === 0) {
      setShowPlaceholder(true)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
        >
          &times;
        </button>

        <h2 className="text-lg font-semibold text-gray-700 text-center mb-6 mt-2">
          End ML Session
        </h2>

        <div className="space-y-4">
          {/* Mathematics for Machine Learning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mathematics for Machine Learning
            </label>
            <input
              type="number"
              min="0"
              value={pageMathML}
              onChange={(e) => setPageMathML(e.target.value)}
              placeholder="Page reached"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-blue focus:border-transparent"
            />
          </div>

          {/* Probabilistic Machine Learning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Probabilistic Machine Learning
            </label>
            <input
              type="number"
              min="0"
              value={pageProbML}
              onChange={(e) => setPageProbML(e.target.value)}
              placeholder="Page reached"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-blue focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes for next session
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={handleNotesChange}
                onFocus={handleNotesFocus}
                onBlur={handleNotesBlur}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-app-blue focus:border-transparent resize-none"
              />
              {showPlaceholder && notes.length === 0 && (
                <span className="absolute top-2 left-3 text-gray-400 pointer-events-none">
                  (optional)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          disabled={!canFinish}
          className="w-full mt-6 py-3 px-4 rounded-lg text-white font-semibold transition-colors disabled:opacity-50 bg-app-blue hover:bg-blue-700"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
              Finishing...
            </span>
          ) : (
            'Finish'
          )}
        </button>

        {/* Don't save session button */}
        <button
          onClick={onDiscard}
          disabled={loading}
          className="w-full mt-3 py-2 px-4 rounded-lg text-gray-500 font-medium transition-colors hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Don't save session
        </button>
      </div>
    </div>
  )
}
