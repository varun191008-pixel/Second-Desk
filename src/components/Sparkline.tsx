import type { FC } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface SparklineProps {
  data: number[];
  width?: `${number}%` | number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline: FC<SparklineProps> = ({
  data,
  width = '100%',
  height = 36,
  color = '#94a3b8',
  className = '',
}) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map((val, idx) => ({ idx, val }));
  const isPositive = data[data.length - 1] >= data[0];
  const strokeColor = color || (isPositive ? '#10b981' : '#ef4444');

  return (
    <div className={`w-full overflow-hidden ${className}`} style={{ height }}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="val"
            stroke={strokeColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
