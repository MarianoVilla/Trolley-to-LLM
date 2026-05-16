import { useEffect, useRef, useState } from 'react'
import type { ModelInfo, Slot, Worldview } from '../types'

interface Props {
  slots: Slot[]
  models: ModelInfo[]
  worldviews: Worldview[]
  onChange: (slots: Slot[]) => void
}

function newSlot(models: ModelInfo[], worldviews: Worldview[]): Slot {
  return {
    slot_id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    model_id: models[0]?.model_id ?? '',
    worldview_id: worldviews[0]?.id ?? '',
  }
}

export default function SlotConfigurator({ slots, models, worldviews, onChange }: Props) {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openTooltip) return
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setOpenTooltip(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openTooltip])

  function updateSlot(slot_id: string, patch: Partial<Omit<Slot, 'slot_id'>>) {
    onChange(slots.map((s) => (s.slot_id === slot_id ? { ...s, ...patch } : s)))
  }

  function removeSlot(slot_id: string) {
    onChange(slots.filter((s) => s.slot_id !== slot_id))
  }

  function addSlot() {
    onChange([...slots, newSlot(models, worldviews)])
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Test Slots
        </h3>
        <button
          onClick={addSlot}
          disabled={models.length === 0}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          + Add slot
        </button>
      </div>

      <div className="space-y-2">
        {slots.map((slot, i) => (
          <div
            key={slot.slot_id}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
          >
            <span className="text-xs font-medium text-gray-400 w-5 text-right shrink-0">
              {i + 1}
            </span>

            <select
              value={slot.model_id}
              onChange={(e) => updateSlot(slot.slot_id, { model_id: e.target.value })}
              className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {models.map((m) => (
                <option key={m.model_id} value={m.model_id}>
                  {m.display_name}
                </option>
              ))}
            </select>

            <div className="flex-1 min-w-0 flex items-center gap-1">
              <select
                value={slot.worldview_id}
                onChange={(e) => updateSlot(slot.slot_id, { worldview_id: e.target.value })}
                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {worldviews.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>

              <div className="relative shrink-0" ref={openTooltip === slot.slot_id ? tooltipRef : null}>
                <button
                  onClick={() => setOpenTooltip(openTooltip === slot.slot_id ? null : slot.slot_id)}
                  title="Ver detalle del cosmovisión"
                  className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-xs font-bold"
                >
                  i
                </button>
                {openTooltip === slot.slot_id && (() => {
                  const wv = worldviews.find((w) => w.id === slot.worldview_id)
                  return (
                    <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-gray-200 bg-white p-3.5 shadow-lg">
                      <p className="text-xs font-semibold text-indigo-700 mb-1.5">{wv?.label}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {wv?.system_prompt || 'Sin instrucción de sistema (respuesta sin orientación).'}
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>

            <button
              onClick={() => removeSlot(slot.slot_id)}
              disabled={slots.length <= 1}
              title="Remove slot"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {slots.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">
          No slots. Add one to start comparing.
        </p>
      )}
    </div>
  )
}
