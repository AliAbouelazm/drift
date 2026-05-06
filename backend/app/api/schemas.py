from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class AnalyzeRequest(BaseModel):
    text: str


class TokenScore(BaseModel):
    token: str
    score: float


class SentimentScores(BaseModel):
    negative: float
    neutral: float
    positive: float


class AnalyzeResponse(BaseModel):
    label: str
    scores: SentimentScores
    explanation: List[TokenScore]


class BatchAnalyzeRequest(BaseModel):
    texts: List[str]


class PredictionResult(BaseModel):
    label: str
    scores: SentimentScores


class BatchAnalyzeResponse(BaseModel):
    results: List[PredictionResult]


class TimeSeriesPoint(BaseModel):
    timestamp: str
    avg_score: float
    positive: int
    negative: int
    neutral: int
    count: int
    rolling_1h: Optional[float] = None
    rolling_6h: Optional[float] = None
    rolling_24h: Optional[float] = None


class AnomalyPost(BaseModel):
    text: str
    score: float
    label: str


class Anomaly(BaseModel):
    timestamp: str
    severity: str
    delta: float
    avg_score: float
    baseline: float
    count: int
    top_posts: List[AnomalyPost]


class TrendData(BaseModel):
    time_series: List[TimeSeriesPoint]
    velocity: float


class SubredditSummary(BaseModel):
    total_posts: int
    positive_pct: float
    negative_pct: float
    neutral_pct: float
    anomaly_count: int


class SubredditResponse(BaseModel):
    subreddit: str
    post_count: int
    trend: TrendData
    anomalies: List[Anomaly]
    keywords: Dict[str, List[str]]
    summary: SubredditSummary


class ModelMetrics(BaseModel):
    f1_macro: float
    accuracy: float
    classification_report: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
