import styles from '../styles/components.module.css';

const SEVERITY_COLORS = {
  mild: '#f59e0b',
  moderate: '#ea580c',
  severe: '#dc2626',
};

export default function AnomalyCard({ anomaly }) {
  const time = new Date(anomaly.timestamp).toLocaleString();
  const topPost = anomaly.top_posts?.[0]?.text || '';
  const truncated = topPost.length > 120 ? topPost.slice(0, 120) + '...' : topPost;

  return (
    <div className={styles.anomalyCard} data-severity={anomaly.severity}>
      <div className={styles.anomalyTime}>{time}</div>
      <div
        className={styles.anomalySeverity}
        style={{ color: SEVERITY_COLORS[anomaly.severity] }}
      >
        {anomaly.severity} anomaly
      </div>
      {truncated && <div className={styles.anomalyPost}>{truncated}</div>}
    </div>
  );
}
