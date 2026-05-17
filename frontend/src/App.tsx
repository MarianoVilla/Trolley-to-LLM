import { useEffect, useRef, useState } from 'react'
import {
  askQuestion,
  createQuestion,
  deleteQuestion,
  fetchModels,
  fetchQuestions,
  fetchWorldviews,
  updateQuestion,
} from './api'
import ExportButton from './components/ExportButton'
import QuestionCard from './components/QuestionCard'
import QuestionFormModal from './components/QuestionFormModal'
import ResultsTable from './components/ResultsTable'
import SlotConfigurator from './components/SlotConfigurator'
import UploadButton from './components/UploadButton'
import type { ModelInfo, ModelResponse, Question, QuestionCreate, Slot, Worldview } from './types'

function makeDefaultSlots(models: ModelInfo[], worldviews: Worldview[]): Slot[] {
  const defaultWorldview = worldviews[0]?.id ?? ''
  return models.map((m, i) => ({
    slot_id: `slot-init-${i}`,
    model_id: m.model_id,
    worldview_id: defaultWorldview,
  }))
}

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; question: Question }
  | null

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [models, setModels] = useState<ModelInfo[]>([])
  const [worldviews, setWorldviews] = useState<Worldview[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [index, setIndex] = useState(0)
  const [responsesMap, setResponsesMap] = useState<Record<number, ModelResponse[]>>({})
  const [loading, setLoading] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [modal, setModal] = useState<ModalState>(null)

  const prevSlotsRef = useRef<Slot[]>([])

  useEffect(() => {
    Promise.all([fetchQuestions(), fetchModels(), fetchWorldviews()])
      .then(([qs, ms, ws]) => {
        setQuestions(qs)
        setModels(ms)
        setWorldviews(ws)
        setSlots(makeDefaultSlots(ms, ws))
      })
      .catch((err) => setInitError(String(err)))
  }, [])

  function handleSlotsChange(newSlots: Slot[]) {
    const prev = prevSlotsRef.current
    const changedSlotIds = new Set(
      newSlots
        .filter((s) => {
          const old = prev.find((p) => p.slot_id === s.slot_id)
          return old && (old.model_id !== s.model_id || old.worldview_id !== s.worldview_id)
        })
        .map((s) => s.slot_id)
    )
    const removedSlotIds = new Set(
      prev.filter((p) => !newSlots.find((s) => s.slot_id === p.slot_id)).map((p) => p.slot_id)
    )

    if (changedSlotIds.size > 0 || removedSlotIds.size > 0) {
      setResponsesMap((prev) => {
        const next: Record<number, ModelResponse[]> = {}
        for (const [qid, resps] of Object.entries(prev)) {
          const filtered = resps.filter(
            (r) => !changedSlotIds.has(r.slot_id) && !removedSlotIds.has(r.slot_id)
          )
          next[Number(qid)] = filtered
        }
        return next
      })
    }

    prevSlotsRef.current = newSlots
    setSlots(newSlots)
  }

  const question = questions[index] ?? null

  async function handleAsk() {
    if (!question || slots.length === 0) return
    setLoading(true)
    try {
      const result = await askQuestion(question.id, slots)
      setResponsesMap((prev) => ({ ...prev, [question.id]: result.responses }))
    } catch (err) {
      alert(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  function handleUploaded(newQuestions: Question[]) {
    setQuestions(newQuestions)
    setIndex(0)
    setResponsesMap({})
  }

  async function handleSaveQuestion(data: QuestionCreate) {
    if (modal?.mode === 'edit') {
      const updated = await updateQuestion(modal.question.id, data)
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))
    } else {
      const created = await createQuestion(data)
      setQuestions((prev) => {
        const next = [...prev, created]
        setIndex(next.length - 1)
        return next
      })
    }
    setModal(null)
  }

  async function handleDeleteQuestion() {
    if (!question) return
    try {
      await deleteQuestion(question.id)
      setResponsesMap((prev) => {
        const next = { ...prev }
        delete next[question.id]
        return next
      })
      setQuestions((prev) => {
        const next = prev.filter((q) => q.id !== question.id)
        setIndex((i) => Math.min(i, Math.max(0, next.length - 1)))
        return next
      })
    } catch (err) {
      alert(`Error: ${err}`)
    }
  }

  const currentResponses = question ? (responsesMap[question.id] ?? []) : []

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 max-w-md text-center">
          <p className="text-red-600 font-semibold mb-2">Failed to load</p>
          <p className="text-gray-500 text-sm">{initError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {modal && (
        <QuestionFormModal
          initial={modal.mode === 'edit' ? modal.question : undefined}
          onSave={handleSaveQuestion}
          onCancel={() => setModal(null)}
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden>🚃</span>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Trolley to LLM</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModal({ mode: 'create' })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              + Add Question
            </button>
            <UploadButton onUploaded={handleUploaded} />
            <ExportButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-20 text-gray-400">Loading questions…</div>
        ) : question ? (
          <>
            <SlotConfigurator
              slots={slots}
              models={models}
              worldviews={worldviews}
              onChange={handleSlotsChange}
            />

            <QuestionCard
              question={question}
              current={index + 1}
              total={questions.length}
              onPrev={() => setIndex((i) => Math.max(0, i - 1))}
              onNext={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              onAsk={handleAsk}
              onEdit={() => setModal({ mode: 'edit', question })}
              onDelete={handleDeleteQuestion}
              loading={loading}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                Model Responses
              </h3>
              <ResultsTable
                slots={slots}
                responses={currentResponses}
                loading={loading}
              />
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}
