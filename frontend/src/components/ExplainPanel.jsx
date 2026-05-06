export default function ExplainPanel({ tokens }) {
  if (!tokens || tokens.length === 0) return null;

  const maxAbs = Math.max(...tokens.map((t) => Math.abs(t.score)), 0.001);

  return (
    <div>
      {tokens.map((t, i) => {
        const pct = (Math.abs(t.score) / maxAbs) * 100;
        const color = t.score >= 0 ? '#16a34a' : '#dc2626';
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                width: 100,
                fontSize: 13,
                color: '#111111',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {t.token}
            </span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: '#f9f9f9',
                border: '1px solid #e5e5e5',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: color,
                }}
              />
            </div>
            <span
              style={{
                width: 52,
                fontSize: 12,
                color: '#6b6b6b',
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {t.score.toFixed(3)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
