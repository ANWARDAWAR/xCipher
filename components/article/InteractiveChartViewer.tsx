"use client";

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { formatChartValue } from '@/lib/chart-format';

interface ChartDataItem {
  name: string;
  [key: string]: any;
}

interface ChartConfig {
  [key: string]: {
    prefix?: string;
    suffix?: string;
  };
}

interface Props {
  data: ChartDataItem[];
  config: ChartConfig;
}

export default function InteractiveChartViewer({ data, config }: Props) {
  const keys = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]).filter(k => k !== 'name');
  }, [data]);

  const [activeMetric, setActiveMetric] = useState<string>(keys[0] || '');

  const formatValue = (value: any, name: string) => {
    const keyConfig = config[name] || {};
    return formatChartValue(value, name, keyConfig.prefix, keyConfig.suffix);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="pointer-events-none bg-neutral-900/95 border border-[var(--line)] rounded-lg p-2 shadow-lg z-50 text-xs">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>
              <span>{formatValue(entry.value, entry.name)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0 || !activeMetric) return null;

  return (
    <div className="w-full my-8 touch-pan-y">
      {/* State-Driven Metric Selector (Tabs) */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {keys.map((key) => {
          const isActive = activeMetric === key;
          return (
            <button
              key={key}
              onClick={() => setActiveMetric(key)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-transparent dark:border-neutral-700'
              }`}
            >
              {key}
            </button>
          );
        })}
      </div>

      <div className="w-full overflow-x-auto no-scrollbar touch-pan-y">
        <div className="h-[400px] min-w-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} vertical={true} />
            <XAxis 
              type="number"
              stroke="var(--muted)"
              tick={{ fontSize: 11, fill: 'var(--muted)' }}
              tickFormatter={(value) => formatValue(value, activeMetric)}
            />
            <YAxis 
              type="category"
              dataKey="name"
              stroke="var(--muted)" 
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              width={120}
              tickFormatter={(value) => {
                if (typeof value === 'string' && value.length > 15) {
                  return value.substring(0, 15) + '...';
                }
                return value;
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ pointerEvents: 'none' }}
              cursor={{ fill: 'var(--surface-2)' }}
            />
            <Bar 
              dataKey={activeMetric} 
              fill="var(--accent)"
              radius={[0, 4, 4, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
