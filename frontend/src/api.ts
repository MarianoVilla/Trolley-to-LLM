import type { AskResponse, ModelInfo, Question, QuestionCreate, Slot, Worldview } from './types'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }
  if (res.status === 204) return undefined as T
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

export function askQuestion(questionId: number, slots: Slot[], force = false): Promise<AskResponse> {
  return request<AskResponse>('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_id: questionId, slots, force }),
  })
}

export function uploadQuestions(file: File): Promise<Question[]> {
  const form = new FormData()
  form.append('file', file)
  return request<Question[]>('/api/questions/upload', { method: 'POST', body: form })
}

export function createQuestion(data: QuestionCreate): Promise<Question> {
  return request<Question>('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateQuestion(id: number, data: Partial<QuestionCreate>): Promise<Question> {
  return request<Question>(`/api/questions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteQuestion(id: number): Promise<void> {
  return request<void>(`/api/questions/${id}`, { method: 'DELETE' })
}

export function downloadExport(format: 'json' | 'csv'): void {
  const a = document.createElement('a')
  a.href = `/api/export?format=${format}`
  a.download = `responses.${format}`
  a.click()
}

export function getQuestionImageUrl(id: number, bust: number): string {
  return `/api/questions/${id}/image${bust > 0 ? `?v=${bust}` : ''}`
}

export function regenerateQuestionImage(id: number): Promise<void> {
  return request<void>(`/api/questions/${id}/image`, { method: 'DELETE' })
}
