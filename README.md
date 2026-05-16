# Trolley to LLM

A side-by-side comparison tool that presents moral dilemmas (trolley-problem style and beyond) to multiple LLMs simultaneously, each optionally constrained by a different ethical worldview. Results are cached per unique combination of question, model, and worldview so repeated runs are instant. Questions can be created, edited, and deleted from the UI; every mutation is persisted to disk immediately.

## What it does

- Loads a set of dilemmas from `backend/questions.json`, which is kept in sync with all in-app edits.
- Lets you **create, edit, and delete questions** directly from the UI without touching any files.
- Lets you configure one or more **slots**, each pairing an LLM with a moral worldview (e.g. GPT-4o as a Kantian deontologist, Claude as a utilitarian).
- Sends each slot's question to [OpenRouter](https://openrouter.ai) with the worldview injected as a system prompt.
- Displays each model's choice, reasoning, and identified moral framework side by side.
- Persists results to `backend/data/responses.json`; each stored response includes a snapshot of the question title, prompt, and options at the time of asking, so the record remains meaningful even if the question is later edited.
- The same `(question_id, slot_id, model_id, worldview_id)` combination is never queried twice unless you explicitly **bypass the cache** via the toggle on the question card, which forces a fresh call and overwrites the stored entry.
- Lets you export all collected responses as JSON or CSV.
- Supports bulk-replacing the question set by uploading a JSON or CSV file.

## Project structure

```
.
├── backend/
│   ├── main.py            # FastAPI application and REST endpoints
│   ├── config.py          # Model list and worldview definitions (with system prompts)
│   ├── llm_service.py     # OpenRouter calls and prompt assembly
│   ├── storage.py         # Disk-based response cache (responses.json)
│   ├── models.py          # Pydantic schemas
│   ├── questions.json     # Built-in dilemma questions (edited in-place by the API)
│   ├── requirements.txt
│   └── data/
│       └── responses.json # Auto-created; stores all past responses with question snapshots
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   ├── types.ts
    │   └── components/
    │       ├── SlotConfigurator.tsx
    │       ├── QuestionCard.tsx
    │       ├── QuestionFormModal.tsx
    │       ├── ResultsTable.tsx
    │       ├── ExportButton.tsx
    │       └── UploadButton.tsx
    └── package.json
```

## Requirements

- Python 3.11+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key

## Setup

### 1. Clone and configure environment

Create `backend/.env`:

```
OPENROUTER_API_KEY=sk-or-...
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173`.
2. Navigate between questions with the **Prev / Next** buttons on the question card.
3. Configure slots in the **Test Slots** panel; each slot is one (model, worldview) pair. Click **+ Add slot** to compare more combinations at once. Use the **i** button next to each worldview to read its full system prompt.
4. Click **Send to All Models** to query all slots. Results appear in the table below. Previously cached results are shown instantly and marked *(cached)*.
5. Change a slot's model or worldview and click **Send to All Models** again; the new combination is queried fresh and saved.
6. Toggle **Bypass cache** on the question card to force a fresh LLM call for all slots, overwriting the stored entries. Useful after editing a question whose wording or options have changed.
7. Use **+ Add Question** in the header to create a new question from scratch.
8. Use the **pencil icon** on any question card to edit its title, prompt, or options.
9. Use the **trash icon** to delete a question (requires confirmation). Its cached responses are cleared from the UI immediately.
10. Use the **Export** button to download all accumulated responses as JSON or CSV.
11. Use **Upload** to bulk-replace the question set with a JSON or CSV file (see format below).

## Managing questions

### In-app (recommended)

Use the **+ Add Question** button in the header to open a form. Fill in the title, prompt, and at least two options, then click **Save**. To edit or delete an existing question use the icons on the question card.

All changes are immediately written back to `backend/questions.json`.

### Directly in questions.json

Each question requires:

```json
{
  "id": 8,
  "title": "Short display title",
  "prompt": "Full scenario description...",
  "options": ["Option A", "Option B"]
}
```

CSV uploads are also supported (`id`, `title`, `prompt`, `options` columns; options separated by `;`).

## Caching behavior

Responses are keyed by `(question_id, slot_id, model_id, worldview_id)`. Changing a slot's model or worldview bypasses the cache and produces a new entry; the old entry is kept, accumulating a full history. Because a question's content can now be edited while its ID stays the same, use the **Bypass cache** toggle whenever you want to re-ask a question whose text or options have changed. Each stored response now carries a snapshot of the question title, prompt, and options so that exported data is self-contained.

## Adding models

Edit the `MODELS` list in `backend/config.py`:

```python
{"model_id": "mistralai/mistral-7b-instruct", "display_name": "Mistral 7B"},
```

Any model ID supported by OpenRouter works.

## Adding worldviews

Edit the `WORLDVIEWS` list in `backend/config.py`. Each entry needs an `id`, a `label`, and a `system_prompt` (empty string for no guidance):

```python
{
    "id": "rawlsian",
    "label": "Rawlsiano",
    "system_prompt": "Razonas desde la posición rawlsiana del velo de la ignorancia...",
},
```

## REST API reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/questions` | List all questions |
| POST | `/api/questions` | Create a question (body: `title`, `prompt`, `options`) |
| PUT | `/api/questions/{id}` | Update a question (partial update supported) |
| DELETE | `/api/questions/{id}` | Delete a question |
| POST | `/api/questions/upload` | Bulk-replace questions from a JSON or CSV file |
| GET | `/api/models` | List available models |
| GET | `/api/worldviews` | List available worldviews |
| POST | `/api/ask` | Query slots; accepts `force: true` to bypass cache |
| GET | `/api/responses` | List all stored responses |
| GET | `/api/export?format=json` | Download responses as JSON |
| GET | `/api/export?format=csv` | Download responses as CSV |

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, httpx, Pydantic |
| LLM gateway | OpenRouter (supports 300+ models) |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
