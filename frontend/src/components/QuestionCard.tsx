import type { Question } from '../types'

interface Props {
  question: Question
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
  onAsk: () => void
  loading: boolean
}

export default function QuestionCard({
  question,
  current,
  total,
  onPrev,
  onNext,
  onAsk,
  loading,
}: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-400 tabular-nums">
            {current} / {total}
          </span>
          <h2 className="text-xl font-semibold text-gray-900">{question.title}</h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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

      <button
        onClick={onAsk}
        disabled={loading}
        className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Asking models…' : 'Send to All Models'}
      </button>
    </div>
  )
}
