import type { Question } from '../types'

interface Props {
  question: Question
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  onAsk: () => void
  onEdit: () => void
  onDelete: () => void
  loading: boolean
  forceReask: boolean
  onToggleForce: () => void
}

export default function QuestionCard({
  question,
  current,
  total,
  onPrev,
  onNext,
  onAsk,
  onEdit,
  onDelete,
  loading,
  forceReask,
  onToggleForce,
}: Props) {
  function handleDelete() {
    if (window.confirm(`Delete "${question.title}"? This cannot be undone.`)) {
      onDelete()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-gray-400 tabular-nums shrink-0">
            {current} / {total}
          </span>
          <h2 className="text-xl font-semibold text-gray-900 truncate">{question.title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label="Edit question"
            title="Edit question"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Delete question"
            title="Delete question"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={onPrev}
            disabled={current === 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={onNext}
            disabled={current === total}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      <p className="text-gray-700 leading-relaxed">{question.prompt}</p>

      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Options</p>
        <ul className="space-y-1.5">
          {question.options.map((opt) => (
            <li key={opt} className="flex items-start gap-2 text-gray-700">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {opt}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onAsk}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Asking models…' : 'Send to All Models'}
        </button>
        <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <div
            onClick={onToggleForce}
            className={`relative w-9 h-5 rounded-full transition-colors ${forceReask ? 'bg-amber-500' : 'bg-gray-200'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${forceReask ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </div>
          <span className="text-sm text-gray-500">Bypass cache</span>
        </label>
      </div>
    </div>
  )
}
