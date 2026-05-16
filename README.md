# Trolley to LLM

A side-by-side comparison tool that presents classic trolley-problem moral dilemmas to multiple LLMs simultaneously, each optionally constrained by a different ethical worldview. Results are cached per unique combination of question, model, and worldview so repeated runs are instant, while any change to the model or worldview triggers a fresh API call.

## What it does

- Loads a set of trolley-problem-style dilemmas from `backend/questions.json`.
- Lets you configure one or more **slots**, each pairing an LLM with a moral worldview (e.g. GPT-4o as a Kantian deontologist, Claude as a utilitarian).
- Sends each slot's question to [OpenRouter](https://openrouter.ai) with the worldview injected as a system prompt.
- Displays each model's choice, reasoning, and identified moral framework side by side.
- Persists results to `backend/data/responses.json`; the same (question, model, worldview) triple is never queried twice.
- Lets you export all collected responses as JSON or CSV.
- Supports uploading a custom question set (JSON or CSV).

## Project structure

```
.
├── backend/
│   ├── main.py            # FastAPI application and REST endpoints
│   ├── config.py          # Model list and worldview definitions (with system prompts)
│   ├── llm_service.py     # OpenRouter calls and prompt assembly
│   ├── storage.py         # Disk-based response cache (responses.json)
│   ├── models.py          # Pydantic schemas
│   ├── questions.json     # Built-in dilemma questions
│   ├── requirements.txt
│   └── data/
│       └── responses.json # Auto-created; stores all past responses
└── frontend/
    ├── src/
    │   ├── App.tsx
    │   ├── api.ts
    │   ├── types.ts
    │   └── components/
    │       ├── SlotConfigurator.tsx
    │       ├── ResultsTable.tsx
    │       ├── QuestionCard.tsx
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
2. Select a question from the left panel.
3. Configure slots in the **Test Slots** panel; each slot is one (model, worldview) pair. Click **+ Add slot** to compare more combinations at once. Use the **i** button next to each worldview to read its full system prompt.
4. Click **Ask** to query all slots. Results appear in the table on the right. Previously cached results are shown instantly and marked *(cached)*.
5. Change a slot's model or worldview and click **Ask** again; the new combination is queried fresh and saved alongside the old entry.
6. Use the **Export** button to download all accumulated responses as JSON or CSV.

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

## Adding questions

Replace or extend `backend/questions.json`, or upload a custom file from the UI. Each question requires:

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

Responses are keyed by `(question_id, slot_id, model_id, worldview_id)`. Changing either the model or the worldview for a slot will bypass the cache and produce a new entry in `responses.json`. The old entry is kept, so you accumulate a full history of runs.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, httpx, Pydantic |
| LLM gateway | OpenRouter (supports 300+ models) |
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite |
