import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  Positive: '#16a34a',
  Negative: '#dc2626',
  Neutral: '#6b6b6b',
};

export default function SentimentChart({ summary }) {
  if (!summary) return null;

  const data = [
    { name: 'Positive', value: summary.positive_pct },
    { name: 'Negative', value: summary.negative_pct },
    { name: 'Neutral', value: summary.neutral_pct },
  ];

  const dominant = data.reduce((a, b) => (a.value > b.value ? a : b)).name;

  return (
    <div style={{ position: 'relative', width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={75}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${v.toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500 }}>{dominant}</div>
      </div>
    </div>
  );
}
