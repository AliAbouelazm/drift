import numpy as np
from datetime import datetime, timedelta, timezone


def detect_anomalies(time_series, posts):
    """
    time_series: list of hourly bucket dicts from compute_trend.
    posts: original post list with "dt", "sentiment_score", "prediction" added by compute_trend.
    Returns anomaly objects where sentiment deviates more than 0.2 from the 24h baseline.
    """
    if len(time_series) < 4:
        return []

    scores = [p["avg_score"] for p in time_series]
    baseline = float(np.mean(scores))

    anomalies = []
    for point in time_series:
        delta = abs(point["avg_score"] - baseline)
        if delta < 0.2:
            continue

        if delta < 0.35:
            severity = "mild"
        elif delta < 0.5:
            severity = "moderate"
        else:
            severity = "severe"

        try:
            window_start = datetime.fromisoformat(point["timestamp"])
            if window_start.tzinfo is None:
                window_start = window_start.replace(tzinfo=timezone.utc)
            window_end = window_start + timedelta(hours=1)
            window_posts = [
                p for p in posts
                if "dt" in p and window_start <= p["dt"] < window_end
            ]
            top = sorted(
                window_posts,
                key=lambda p: abs(p.get("sentiment_score", 0) - baseline),
                reverse=True,
            )[:3]
            top_posts = [
                {
                    "text": p["text"],
                    "score": float(p["sentiment_score"]),
                    "label": p["prediction"]["label"],
                }
                for p in top
            ]
        except Exception:
            top_posts = []

        anomalies.append({
            "timestamp": point["timestamp"],
            "severity": severity,
            "delta": float(delta),
            "avg_score": float(point["avg_score"]),
            "baseline": baseline,
            "count": point.get("count", 0),
            "top_posts": top_posts,
        })

    return anomalies
