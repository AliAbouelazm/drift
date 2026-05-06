# Drift

Drift analyzes sentiment across Reddit communities using a fine-tuned DistilBERT model. You enter a subreddit name, and Drift fetches recent posts, classifies each one as positive, negative, or neutral, surfaces the emotional distribution as a donut chart and time series, alerts you when sentiment spikes or drops unusually, and shows token-level SHAP explanations for why individual words drove each classification.

## Architecture

```
Browser (React 18 + Vite)
         |
         | HTTP/JSON
         v
  FastAPI (Python 3.11)
         |
         +-- POST /analyze         --> DistilBERT inference + SHAP
         +-- POST /analyze/batch   --> batched inference
         +-- GET  /subreddit/{n}   --> Reddit public JSON API
         |                                |
         |                                v
         |                        batch inference
         |                        hourly trend bucketing
         |                        anomaly detection
         |
         +-- GET  /model/metrics   --> saved test set JSON
         +-- GET  /health          --> status check
```

## Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend | React 18, Vite, CSS Modules | Dashboard, single-post analysis, multi-subreddit comparison |
| Backend | FastAPI, Python 3.11 | REST API, request handling, rate limiting |
| ML model | DistilBERT fine-tuned | 3-class sentiment classification |
| Training data | tweet_eval, go_emotions (HuggingFace) | Labeled sentiment and emotion examples |
| Explainability | SHAP | Token-level attribution scores |
| Charts | Recharts | Time series, donut, comparison line chart |
| Reddit data | Public JSON endpoint | Live subreddit posts, no credentials required |
| Deployment | HuggingFace Spaces (backend), Vercel (frontend) | Production hosting |

## Model

**Datasets:** `cardiffnlp/tweet_eval` (sentiment subset) and `go_emotions` (simplified, joy/anger/fear/sadness/neutral only). Both loaded from HuggingFace datasets, merged, and class-balanced by undersampling majority classes to 2x the minority size.

**Architecture:** `distilbert-base-uncased` fine-tuned for 3-class sequence classification: negative (0), neutral (1), positive (2).

**Training config:** 4 epochs, learning rate 2e-5, linear warmup over 10% of steps, weight decay 0.01, batch size 32 train / 64 eval, early stopping patience 2, best checkpoint selected by validation F1 macro.

**Test set results** (fill in after running training):

| Metric | Score |
|---|---|
| F1 macro | TBD |
| Accuracy | TBD |

Run `python -m app.model.evaluate` from `backend/` after training to get the full per-class breakdown.

## Running locally

### Prerequisites

- Python 3.11
- Node.js 18+
- An M-series Mac or any machine with at least 8 GB RAM

### Backend

```bash
cd drift/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Train the model (required before starting the server):

```bash
python -m app.model.train
```

Training uses MPS on Apple Silicon automatically. Expect 20-40 minutes on an M-series Mac.

Start the API server:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd drift/frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`. The frontend calls the backend at `http://localhost:8000` by default. To override, create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:8000
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `MODEL_PATH` | Path to the saved model directory | `app/model/saved_model` |
| `ENV` | Environment name | `development` |
| `VITE_API_URL` | Backend base URL used by the frontend | `http://localhost:8000` |

## Deployment

### Backend on HuggingFace Spaces

The backend runs as a Docker Space. The model is loaded from the HuggingFace Hub (`AliAbouelazm/drift-sentiment`) at startup — no weights are committed to the repo.

1. Push `backend/hf_deploy/` to a HuggingFace Space with Docker SDK.
2. Set `MODEL_PATH` to your Hub model ID in the Space settings.
3. The Space exposes port 7860; HuggingFace proxies it automatically.

### Frontend on Vercel

1. Import the repo on Vercel.
2. Set the root directory to `drift/frontend`.
3. Add environment variable `VITE_API_URL` pointing to your HuggingFace Space URL.
4. Deploy. Vercel detects Vite automatically.

## Live demo

[https://drift-git-main-aliabouelazms-projects.vercel.app](https://drift-git-main-aliabouelazms-projects.vercel.app)
