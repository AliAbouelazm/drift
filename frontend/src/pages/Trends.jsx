import { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchSubreddit } from '../api/client';
import styles from '../styles/trends.module.css';

const TIME_RANGES = ['1h', '6h', '24h', '7d'];
const LINE_COLORS = ['#2563eb', '#16a34a', '#dc2626'];
const SEVERITY_COLORS = {
  mild: '#f59e0b',
  moderate: '#ea580c',
  severe: '#dc2626',
};

const HOURS_MAP = { '1h': 1, '6h': 6, '24h': 24, '7d': 168 };

function filterByRange(timeSeries, range) {
  const hours = HOURS_MAP[range] || 24;
  if (!timeSeries || timeSeries.length === 0) return [];
  const cutoff = new Date(timeSeries[timeSeries.length - 1].timestamp);
  cutoff.setHours(cutoff.getHours() - hours);
  return timeSeries.filter((p) => new Date(p.timestamp) >= cutoff);
}

function buildChartData(subreddits, data, range) {
  if (subreddits.length === 0) return [];

  const pointMap = {};
  subreddits.forEach((name) => {
    const ts = filterByRange(data[name]?.trend?.time_series, range);
    ts.forEach((point) => {
      const key = point.timestamp;
      if (!pointMap[key]) {
        pointMap[key] = {
          time: new Date(point.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
      }
      pointMap[key][name] = point.avg_score;
    });
  });

  return Object.values(pointMap).sort((a, b) => a.time.localeCompare(b.time));
}

export default function Trends() {
  const [timeRange, setTimeRange] = useState('24h');
  const [subreddits, setSubreddits] = useState([]);
  const [input, setInput] = useState('');
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function addSubreddit() {
    const name = input.trim().replace(/^r\//, '');
    if (!name || subreddits.includes(name) || subreddits.length >= 3) return;

    setLoading(true);
    setError(null);
    try {
      const result = await fetchSubreddit(name);
      setSubreddits((prev) => [...prev, name]);
      setData((prev) => ({ ...prev, [name]: result }));
      setInput('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function removeSubreddit(name) {
    setSubreddits((prev) => prev.filter((s) => s !== name));
    setData((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  const chartData = buildChartData(subreddits, data, timeRange);
  const allAnomalies = subreddits.flatMap((name) => data[name]?.anomalies || []);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Trends</h1>

      <div className={styles.controls}>
        <div className={styles.timeRangeButtons}>
          {TIME_RANGES.map((range) => (
            <button
              key={range}
              className={
                timeRange === range ? styles.timeButtonActive : styles.timeButton
              }
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>

        <div className={styles.subredditInput}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSubreddit()}
            placeholder="Add subreddit (max 3)"
            className={styles.input}
            disabled={subreddits.length >= 3 || loading}
          />
          <button
            onClick={addSubreddit}
            className={styles.addButton}
            disabled={loading || subreddits.length >= 3}
          >
            {loading ? 'Loading...' : 'Add'}
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tags}>
        {subreddits.map((name, i) => (
          <span
            key={name}
            className={styles.tag}
            style={{ borderColor: LINE_COLORS[i] }}
          >
            r/{name}
            <button
              className={styles.tagRemove}
              onClick={() => removeSubreddit(name)}
            >
              x
            </button>
          </span>
        ))}
      </div>

      {subreddits.length === 0 && (
        <div className={styles.emptyState}>
          Add up to 3 subreddits to compare their sentiment over time.
        </div>
      )}

      {chartData.length > 0 && (
        <div className={styles.chartCard}>
          <div className={styles.sectionHeading}>Sentiment Score Comparison</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b6b6b' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b6b6b' }}
                domain={[-1, 1]}
                tickCount={5}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {subreddits.map((name, i) => (
                <Line
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={LINE_COLORS[i]}
                  dot={false}
                  strokeWidth={1.5}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {allAnomalies.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeading}>Anomaly Timeline</div>
          <div className={styles.timeline}>
            <div className={styles.timelineLine} />
            {allAnomalies.map((a, i) => (
              <div
                key={i}
                className={styles.dot}
                style={{ background: SEVERITY_COLORS[a.severity] }}
                title={`${a.severity} - ${new Date(a.timestamp).toLocaleString()}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
