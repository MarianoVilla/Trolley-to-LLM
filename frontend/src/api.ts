import type { AskResponse, ModelInfo, Question, Slot, Worldview } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  return res.json() as Promise<T>
}

export function fetchQuestions(): Promise<Question[]> {
  return request<Question[]>('/api/questions')
}

export function fetchModels(): Promise<ModelInfo[]> {
  return request<ModelInfo[]>('/api/models')
}

export function fetchWorldviews(): Promise<Worldview[]> {
  return request<Worldview[]>('/api/worldviews')
}

export function askQuestion(questionId: number, slots: Slot[]): Promise<AskResponse> {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, slots }),
  })
}

export function uploadQuestions(file: File): Promise<Question[]> {
  const form = new FormData()
  form.append('file', file)
  return request<Question[]>('/api/questions/upload', { method: 'POST', body: form })
}

export function downloadExport(format: 'json' | 'csv'): void {
  const a = document.createElement('a')
  a.href = `/api/export?format=${format}`
  a.download = `responses.${format}`
  a.click()
}
