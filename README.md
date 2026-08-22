Recipe Story AI(Backend)
This backend powers the “Recipe Story AI” experience a small FastAPI service that takes a user’s mood, preferences, and kitchen context, then recommends a recipe and generates a warm, human‑like story to go with it.

It’s designed to be simple, readable, and easy to extend. The frontend (Svelte) sends a structured JSON payload, and the backend handles filtering, scoring, and story generation.

What this backend does:-

1) Receives the 6‑step wizard answers from the frontend

2) Picks the best‑matching recipe from the dataset

3) Generates a friendly “recipe story” using an LLM

4) Returns everything in a clean JSON response

5) Supports human‑written stories via a dictionary lookup

6) Provides a small evaluation endpoint (BLEU score)

Tech Stack
FastAPI :main web framework

Pydantic v2 :request/response models

Pandas :recipe dataset filtering

Uvicorn :ASGI server

HuggingFace Hub (optional) :for real LLM inference

Running the backend-
Install dependencies:
pip install -r requirements.txt

Start the server:
uvicorn app:app --reload --port 8000

The backend will auto‑reload when you edit files.

API Endpoints
POST /api/recommend-recipe
Main endpoint used by the frontend.
Accepts the wizard JSON and returns:

-recipe metadata

-ingredients

-nutrition

-tags

-LLM‑generated story

-optional human‑written story

POST /recipe
Alias for the same logic

POST /evaluate/bleu
Optional endpoint for comparing two stories using BLEU

Human‑written stories:
The backend supports injecting your own stories through a simple dictionary:
HUMAN_STORIES = {
    31490: "Your custom story here...",
    338753: "Another story..."
}
If a recipe ID isn’t found, the backend falls back to:
"No human-written story available yet."


Development Notes:
The backend is intentionally one file (app.py) to keep things easy to read.

The recipe dataset is loaded once at startup for performance.

Story generation is abstracted so you can swap in any LLM.

The API contract is documented in API_CONTRACT.md.

Project Structure:
teamproject/

--- app.py                # FastAPI backend
├── requirements.txt      # Python dependencies
├── API_CONTRACT.md       # Frontend-backend contract
├── data/                 # Recipe dataset (CSV)
└── README.md             # This file

cd ~/Downloads/teamproject
source venv/bin/activate
uvicorn app:app --reload --port 8000

cd ~/Downloads/frontend
npm run dev