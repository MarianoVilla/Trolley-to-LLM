import type { ModelResponse, Slot } from '../types'

const MODEL_COLORS: string[] = [
  'bg-indigo-50 border-indigo-200',
  'bg-emerald-50 border-emerald-200',
  'bg-amber-50 border-amber-200',
  'bg-rose-50 border-rose-200',
  'bg-sky-50 border-sky-200',
  'bg-violet-50 border-violet-200',
  'bg-orange-50 border-orange-200',
]

interface Props {
  slots: Slot[]
  responses: ModelResponse[]
  loading: boolean
}

function Skeleton({ count }: { count: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-xl" />
      ))}
    </div>
  )
}

export default function ResultsTable({ slots, responses, loading }: Props) {
  if (loading) return <Skeleton count={Math.max(slots.length, 1)} />

  if (responses.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">
        Press "Send to All Models" to see responses.
      </p>
    )
  }

  const ordered = slots
    .map((s) => responses.find((r) => r.slot_id === s.slot_id))
    .filter(Boolean) as ModelResponse[]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 text-xs uppercase tracking-wide border-b border-gray-200">
            <th className="pb-2 pr-4 font-semibold w-32">Model</th>
            <th className="pb-2 pr-4 font-semibold w-40">Worldview</th>
            <th className="pb-2 pr-4 font-semibold w-44">Choice</th>
            <th className="pb-2 pr-4 font-semibold">Reasoning</th>
            <th className="pb-2 font-semibold w-36">Framework</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {ordered.map((resp, i) => {
            const colorClass = MODEL_COLORS[i % MODEL_COLORS.length]
            return (
              <tr key={resp.slot_id} className={`border-l-4 ${colorClass}`}>
                <td className="py-3 pr-4 pl-3 font-semibold text-gray-800 align-top">
                  {resp.display_name}
                </td>
                <td className="py-3 pr-4 align-top text-gray-600 text-xs italic">
                  {resp.worldview_label}
                </td>
                <td className="py-3 pr-4 align-top text-gray-700">
                  {resp.error ? (
                    <span className="text-red-500 text-xs">{resp.error}</span>
                  ) : (
                    resp.choice ?? <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-3 pr-4 align-top text-gray-600 leading-relaxed">
                  {resp.reasoning ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="py-3 align-top text-gray-500 italic">
                  {resp.moral_framework ?? <span className="text-gray-300">—</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
