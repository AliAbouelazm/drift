import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchModelMetrics } from '../api/client';
import componentStyles from '../styles/components.module.css';
import styles from '../styles/modelperformance.module.css';

const CLASS_COLORS = {
  negative: '#dc2626',
  neutral: '#6b6b6b',
  positive: '#16a34a',
};

const METRIC_COLORS = {
  precision: '#3b82f6',
  recall: '#8b5cf6',
  'f1-score': '#f59e0b',
};

const CLASSES = ['negative', 'neutral', 'positive'];

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelMetrics()
      .then(setMetrics)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Model Performance</h1>
        <div className={styles.loading}>Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.heading}>Model Performance</h1>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  const report = metrics.classification_report;

  const barData = CLASSES.map((cls) => ({
    class: cls,
    precision: parseFloat((report[cls]?.precision * 100).toFixed(1)),
    recall: parseFloat((report[cls]?.recall * 100).toFixed(1)),
    'f1-score': parseFloat((report[cls]?.['f1-score'] * 100).toFixed(1)),
  }));

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Model Performance</h1>

      <div className={styles.statsRow}>
        <div className={componentStyles.statCard}>
          <p className={componentStyles.statValue}>
            {(metrics.f1_macro * 100).toFixed(1)}%
          </p>
          <p className={componentStyles.statLabel}>F1 Macro</p>
        </div>
        <div className={componentStyles.statCard}>
          <p className={componentStyles.statValue}>
            {(metrics.accuracy * 100).toFixed(1)}%
          </p>
          <p className={componentStyles.statLabel}>Accuracy</p>
        </div>
        {CLASSES.map((cls) => (
          <div className={componentStyles.statCard} key={cls}>
            <p
              className={componentStyles.statValue}
              style={{ color: CLASS_COLORS[cls] }}
            >
              {((report[cls]?.['f1-score'] ?? 0) * 100).toFixed(1)}%
            </p>
            <p className={componentStyles.statLabel}>{cls} F1</p>
          </div>
        ))}
      </div>

      <div className={styles.chartCard}>
        <div className={styles.sectionHeading}>
          Precision / Recall / F1 by Class
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={barData}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            barCategoryGap="28%"
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="class"
              tick={{ fontSize: 13, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value, name) => [`${value}%`, name]}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                fontSize: 13,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
            />
            {Object.entries(METRIC_COLORS).map(([metric, color]) => (
              <Bar key={metric} dataKey={metric} fill={color} radius={[2, 2, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.class} fill={color} />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.sectionHeading}>Classification Report</div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Class</th>
              <th className={styles.th}>Precision</th>
              <th className={styles.th}>Recall</th>
              <th className={styles.th}>F1 Score</th>
              <th className={styles.th}>Support</th>
            </tr>
          </thead>
          <tbody>
            {CLASSES.map((cls) => (
              <tr key={cls} className={styles.tr}>
                <td className={styles.td}>
                  <span
                    className={styles.classTag}
                    style={{
                      color: CLASS_COLORS[cls],
                      background:
                        cls === 'positive'
                          ? '#dcfce7'
                          : cls === 'negative'
                          ? '#fee2e2'
                          : 'var(--surface)',
                      border: `1px solid ${CLASS_COLORS[cls]}33`,
                    }}
                  >
                    {cls}
                  </span>
                </td>
                <td className={styles.td}>
                  {((report[cls]?.precision ?? 0) * 100).toFixed(1)}%
                </td>
                <td className={styles.td}>
                  {((report[cls]?.recall ?? 0) * 100).toFixed(1)}%
                </td>
                <td className={styles.td} style={{ fontWeight: 500 }}>
                  {((report[cls]?.['f1-score'] ?? 0) * 100).toFixed(1)}%
                </td>
                <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                  {report[cls]?.support?.toLocaleString() ?? '—'}
                </td>
              </tr>
            ))}
            <tr className={`${styles.tr} ${styles.trAvg}`}>
              <td className={styles.td} style={{ fontWeight: 500 }}>macro avg</td>
              <td className={styles.td}>
                {((report['macro avg']?.precision ?? 0) * 100).toFixed(1)}%
              </td>
              <td className={styles.td}>
                {((report['macro avg']?.recall ?? 0) * 100).toFixed(1)}%
              </td>
              <td className={styles.td} style={{ fontWeight: 500 }}>
                {((report['macro avg']?.['f1-score'] ?? 0) * 100).toFixed(1)}%
              </td>
              <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                {report['macro avg']?.support?.toLocaleString() ?? '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
