import json
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException

from app.analytics.anomaly import detect_anomalies
from app.analytics.trends import compute_trend, top_keywords
from app.api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    HealthResponse,
    ModelMetrics,
    SubredditResponse,
)
from app.model.predict import explain, predict_batch, predict_single

router = APIRouter()

MODEL_DIR = os.environ.get(
    "MODEL_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "saved_model"),
)
REDDIT_HEADERS = {"User-Agent": "drift-analytics/1.0 (portfolio project)"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    result = predict_single(req.text)
    explanation = explain(req.text)
    return {
        "label": result["label"],
        "scores": result["scores"],
        "explanation": explanation,
    }


@router.post("/analyze/batch", response_model=BatchAnalyzeResponse)
async def analyze_batch(req: BatchAnalyzeRequest):
    results = predict_batch(req.texts)
    return {"results": results}


@router.get("/subreddit/{name}", response_model=SubredditResponse)
async def get_subreddit(name: str):
    url = f"https://www.reddit.com/r/{name}/hot.json?limit=100"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.get(url, headers=REDDIT_HEADERS)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Subreddit r/{name} not found")
            if e.response.status_code == 403:
                raise HTTPException(status_code=403, detail=f"Subreddit r/{name} is private")
            raise HTTPException(status_code=502, detail=f"Reddit returned {e.response.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Could not reach Reddit: {str(e)}")

    data = resp.json()
    children = data.get("data", {}).get("children", [])

    posts = []
    for child in children:
        d = child.get("data", {})
        text = d.get("selftext", "").strip()
        if not text or text in ("[removed]", "[deleted]"):
            text = d.get("title", "").strip()
        if not text:
            continue
        created = d.get("created_utc", 0)
        timestamp = datetime.fromtimestamp(created, tz=timezone.utc).isoformat()
        posts.append({"text": text, "timestamp": timestamp})

    if not posts:
        raise HTTPException(status_code=404, detail=f"No usable posts found in r/{name}")

    trend = compute_trend(posts)
    anomalies = detect_anomalies(trend["time_series"], posts)

    keywords = {
        "positive": top_keywords(posts, "positive"),
        "negative": top_keywords(posts, "negative"),
        "neutral": top_keywords(posts, "neutral"),
    }

    total = len(posts)
    label_counts = {"positive": 0, "negative": 0, "neutral": 0}
    for p in posts:
        label = p.get("prediction", {}).get("label", "neutral")
        label_counts[label] += 1

    summary = {
        "total_posts": total,
        "positive_pct": round(label_counts["positive"] / total * 100, 1),
        "negative_pct": round(label_counts["negative"] / total * 100, 1),
        "neutral_pct": round(label_counts["neutral"] / total * 100, 1),
        "anomaly_count": len(anomalies),
    }

    return {
        "subreddit": name,
        "post_count": total,
        "trend": trend,
        "anomalies": anomalies,
        "keywords": keywords,
        "summary": summary,
    }


@router.get("/model/metrics", response_model=ModelMetrics)
async def model_metrics():
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(
            status_code=404,
            detail="Metrics not found. Run python -m app.model.train first.",
        )
    with open(metrics_path) as f:
        return json.load(f)


@router.get("/health", response_model=HealthResponse)
async def health():
    return {"status": "ok"}
