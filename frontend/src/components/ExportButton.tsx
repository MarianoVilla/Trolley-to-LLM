import { downloadExport } from '../api'

export default function ExportButton() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 font-medium">Export all:</span>
      <button
        onClick={() => downloadExport('json')}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        JSON
      </button>
      <button
        onClick={() => downloadExport('csv')}
        className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
      >
        CSV
      </button>
    </div>
  )
}
