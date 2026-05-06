import { useEffect, useState } from 'react';
import { analyzeText } from '../api/client';
import ExplainPanel from '../components/ExplainPanel';
import styles from '../styles/analyze.module.css';
import componentStyles from '../styles/components.module.css';

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const BAR_COLORS = {
  positive: '#16a34a',
  negative: '#dc2626',
  neutral: '#6b6b6b',
};

export default function Analyze() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedText = useDebounce(text, 600);

  useEffect(() => {
    if (!debouncedText.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    analyzeText(debouncedText)
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedText]);

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Analyze</h1>

      <textarea
        className={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste or type any text to classify its sentiment..."
      />

      {loading && <div className={styles.loading}>Analyzing...</div>}
      {error && !loading && (
        <div style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>{error}</div>
      )}

      {!text.trim() && (
        <p className={styles.hint}>Results update automatically as you type.</p>
      )}

      {result && !loading && (
        <div className={styles.results}>
          <div className={styles.labelRow}>
            <span className={componentStyles.sentimentPill} data-label={result.label}>
              {result.label}
            </span>
          </div>

          <div className={styles.scoresSection}>
            <div className={styles.sectionHeading}>Confidence</div>
            {Object.entries(result.scores).map(([label, score]) => (
              <div key={label} className={styles.scoreRow}>
                <span className={styles.scoreLabel}>{label}</span>
                <div className={styles.barTrack}>
                  <div
                    style={{
                      width: `${score * 100}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: BAR_COLORS[label],
                    }}
                  />
                </div>
                <span className={styles.scoreValue}>
                  {(score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {result.explanation && result.explanation.length > 0 && (
            <div className={styles.explainSection}>
              <div className={styles.sectionHeading}>Token Explanations</div>
              <ExplainPanel tokens={result.explanation} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
