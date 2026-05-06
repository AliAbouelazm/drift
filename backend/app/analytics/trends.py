import numpy as np
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer

from app.model.predict import predict_batch


def compute_trend(posts):
    """
    posts: list of dicts with "text" and "timestamp" (ISO format).
    Runs batch inference, buckets results hourly, computes rolling averages.
    Mutates each post in-place to add "prediction", "sentiment_score", and "dt".
    """
    texts = [p["text"] for p in posts]
    predictions = predict_batch(texts)

    for post, pred in zip(posts, predictions):
        post["prediction"] = pred
        post["sentiment_score"] = pred["scores"]["positive"] - pred["scores"]["negative"]
        try:
            post["dt"] = datetime.fromisoformat(post["timestamp"])
            if post["dt"].tzinfo is None:
                post["dt"] = post["dt"].replace(tzinfo=timezone.utc)
        except (ValueError, KeyError):
            post["dt"] = datetime.now(tz=timezone.utc)

    sorted_posts = sorted(posts, key=lambda p: p["dt"])
    if not sorted_posts:
        return {"time_series": [], "velocity": 0.0}

    start = sorted_posts[0]["dt"].replace(minute=0, second=0, microsecond=0)
    end = sorted_posts[-1]["dt"]

    time_series = []
    current = start
    while current <= end:
        next_hour = current + timedelta(hours=1)
        bucket = [p for p in sorted_posts if current <= p["dt"] < next_hour]
        if bucket:
            scores = [p["sentiment_score"] for p in bucket]
            label_counts = defaultdict(int)
            for p in bucket:
                label_counts[p["prediction"]["label"]] += 1

            time_series.append({
                "timestamp": current.isoformat(),
                "avg_score": float(np.mean(scores)),
                "positive": label_counts["positive"],
                "negative": label_counts["negative"],
                "neutral": label_counts["neutral"],
                "count": len(bucket),
            })
        current = next_hour

    windows = {"1h": 1, "6h": 6, "24h": 24}
    for i, point in enumerate(time_series):
        for name, hours in windows.items():
            window = time_series[max(0, i - hours + 1) : i + 1]
            point[f"rolling_{name}"] = float(np.mean([p["avg_score"] for p in window]))

    velocity = 0.0
    if len(time_series) >= 2:
        velocity = float(time_series[-1]["rolling_24h"] - time_series[0]["rolling_24h"])

    return {"time_series": time_series, "velocity": velocity}


def top_keywords(posts, sentiment_label):
    filtered = [p for p in posts if p.get("prediction", {}).get("label") == sentiment_label]
    if len(filtered) < 3:
        return []

    texts = [p["text"] for p in filtered]
    vectorizer = TfidfVectorizer(max_features=10, stop_words="english", ngram_range=(1, 2))
    try:
        vectorizer.fit_transform(texts)
        return vectorizer.get_feature_names_out().tolist()
    except ValueError:
        return []
