# AdaptIQ AI Backend

FastAPI service for the AdaptIQ learning companion.

## Run locally

From the repository root:

```powershell
cd Adaptiq.ai/backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --env-file .env --port 8000
```

The API is available at `http://localhost:8000`. Interactive documentation is at `http://localhost:8000/docs`.

## Supabase environment variables

Put these values only in `backend/.env`, never in `frontend/.env.local` or client-side TypeScript:

- `SUPABASE_URL`: Supabase Dashboard -> Project Settings -> API -> Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard -> Project Settings -> API -> `service_role` secret key
- `ALLOWED_ORIGINS`: frontend origins allowed by CORS, normally `http://localhost:3000`
- `OPENAI_API_KEY`: OpenAI API key. This value must stay in `backend/.env` and is only read by FastAPI.
- `OPENAI_MODEL`: OpenAI model name, defaults to `gpt-4o-mini`.
- `AI_DEMO_MODE`: set to `true` to use local Twin-aware chat and quiz responses without calling OpenAI or requiring an API key. Set to `false` to use OpenAI.
- `AI_TIMEOUT_SECONDS`: maximum wait for an AI response, normally `45`

Run `supabase/schema.sql` in Supabase Dashboard -> SQL Editor before starting with Supabase credentials. The service-role key is read only by FastAPI and bypasses RLS, so these API routes must later derive `student_id` from verified Supabase Auth tokens rather than trusting arbitrary client input. When credentials are absent, the API uses the process-local development repository.

## Integration status

- When `AI_DEMO_MODE=true`, chat and quiz generation use local Twin-aware demo responses and never create an OpenAI client.
- When `AI_DEMO_MODE=false`, chat and quiz generation use the official OpenAI Python SDK with `AsyncOpenAI` and require `OPENAI_API_KEY`. Quiz output is validated for the requested question count and answer keys.
- PDF and lecture uploads validate the incoming file and return an explicit not-processed status. Text extraction, transcription, and generated notes require their processing integrations.
- Learning Twin, quiz submission, progress, and history use an in-memory development repository when Supabase credentials are absent. State resets when the process restarts; configure Supabase for persistent storage.
