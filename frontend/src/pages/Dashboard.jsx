import { useState } from 'react';
import { fetchSubreddit } from '../api/client';
import AnomalyCard from '../components/AnomalyCard';
import SentimentChart from '../components/SentimentChart';
import TrendLine from '../components/TrendLine';
import styles from '../styles/dashboard.module.css';
import componentStyles from '../styles/components.module.css';

const DEMO_SUBREDDITS = ['programming', 'worldnews', 'gaming', 'personalfinance', 'fitness'];

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function load(name) {
    setQuery(name);
    setLoading(true);
    setError(null);
    setData(null);
    fetchSubreddit(name)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  function handleSearch(e) {
    e.preventDefault();
    const name = query.trim().replace(/^r\//, '');
    if (!name) return;
    load(name);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a subreddit name"
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton} disabled={loading}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && (
        <div className={styles.errorBlock}>
          <p className={styles.errorText}>{error}</p>
          <p className={styles.errorHint}>Try one of the preloaded subreddits:</p>
          <div className={styles.demoButtons}>
            {DEMO_SUBREDDITS.map((name) => (
              <button key={name} className={styles.demoButton} onClick={() => load(name)}>
                r/{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!data && !loading && !error && (
        <div className={styles.emptyState}>
          <p className={styles.emptyStateText}>Enter a subreddit above or pick one below to get started.</p>
          <div className={styles.demoButtons}>
            {DEMO_SUBREDDITS.map((name) => (
              <button key={name} className={styles.demoButton} onClick={() => load(name)}>
                r/{name}
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <>
          {data.demo && (
            <div className={styles.demoBanner}>
              Demo data — Reddit is not accessible from this server. Showing pre-fetched posts with real model inference.
            </div>
          )}
          <div className={styles.statsRow}>
            <div className={componentStyles.statCard}>
              <p className={componentStyles.statValue}>{data.summary.total_posts}</p>
              <p className={componentStyles.statLabel}>Total Posts</p>
            </div>
            <div className={componentStyles.statCard}>
              <p className={componentStyles.statValue} style={{ color: '#16a34a' }}>
                {data.summary.positive_pct}%
              </p>
              <p className={componentStyles.statLabel}>Positive</p>
            </div>
            <div className={componentStyles.statCard}>
              <p className={componentStyles.statValue} style={{ color: '#dc2626' }}>
                {data.summary.negative_pct}%
              </p>
              <p className={componentStyles.statLabel}>Negative</p>
            </div>
            <div className={componentStyles.statCard}>
              <p className={componentStyles.statValue}>{data.summary.anomaly_count}</p>
              <p className={componentStyles.statLabel}>Anomalies Detected</p>
            </div>
          </div>

          <div className={styles.chartsRow}>
            <div className={styles.chartCard} style={{ flex: 1 }}>
              <div className={styles.sectionHeading}>Sentiment Breakdown</div>
              <SentimentChart summary={data.summary} />
            </div>
            <div className={styles.chartCard} style={{ flex: 2 }}>
              <div className={styles.sectionHeading}>Sentiment Over Time</div>
              <TrendLine timeSeries={data.trend.time_series} />
            </div>
          </div>

          {data.anomalies.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeading}>Anomalies</div>
              {data.anomalies.map((a, i) => (
                <AnomalyCard key={i} anomaly={a} />
              ))}
            </div>
          )}

          <div className={styles.section}>
            <div className={styles.sectionHeading}>Top Keywords</div>
            <div className={styles.keywordsGrid}>
              {['positive', 'negative', 'neutral'].map((sentiment) => (
                <div key={sentiment}>
                  <div
                    className={styles.keywordLabel}
                    style={{
                      color:
                        sentiment === 'positive' ? '#16a34a' : sentiment === 'negative' ? '#dc2626' : '#6b6b6b',
                    }}
                  >
                    {sentiment}
                  </div>
                  <div>
                    {(data.keywords[sentiment] || []).map((kw, i) => (
                      <span key={i} className={componentStyles.keyword}>{kw}</span>
                    ))}
                    {(data.keywords[sentiment] || []).length === 0 && (
                      <span style={{ fontSize: 12, color: '#6b6b6b' }}>Not enough posts</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
