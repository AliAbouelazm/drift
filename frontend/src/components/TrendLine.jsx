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

export default function TrendLine({ timeSeries }) {
  if (!timeSeries || timeSeries.length === 0) {
    return (
      <div
        style={{
          height: 240,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b6b6b',
          fontSize: 13,
        }}
      >
        No time series data available
      </div>
    );
  }

  const data = timeSeries.map((point) => ({
    time: new Date(point.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    positive: point.positive,
    negative: point.negative,
    neutral: point.neutral,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b6b6b' }} />
        <YAxis tick={{ fontSize: 11, fill: '#6b6b6b' }} allowDecimals={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="positive"
          stroke="#16a34a"
          dot={false}
          strokeWidth={1.5}
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke="#dc2626"
          dot={false}
          strokeWidth={1.5}
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke="#6b6b6b"
          dot={false}
          strokeWidth={1.5}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
