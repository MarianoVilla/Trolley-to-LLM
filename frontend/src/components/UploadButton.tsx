import { useRef } from 'react'
import { uploadQuestions } from '../api'
import type { Question } from '../types'

interface Props {
  onUploaded: (questions: Question[]) => void
}

export default function UploadButton({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const questions = await uploadQuestions(file)
      onUploaded(questions)
    } catch (err) {
      alert(`Upload failed: ${err}`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.csv"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        Upload questions
      </button>
    </>
  )
}
