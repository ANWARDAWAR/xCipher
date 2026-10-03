"use client";

import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import { formatChartValue } from '@/lib/chart-format';
import { Maximize } from 'lucide-react';
import MediaModal, { type MediaSummary } from './MediaModal';

interface DynamicChartProps {
  config: any[];
  chartType: string;
  animateOnce?: boolean;
  fullView?: boolean;
}

const COLORS = [
  'var(--accent)',
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function DynamicChart({ config, chartType, animateOnce = true, fullView = true }: DynamicChartProps) {
  const keys = useMemo(() => {
    if (!config || config.length === 0) return [];
    return Object.keys(config[0]).filter(k => k !== 'name');
  }, [config]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartHeight = chartType === 'pie' ? 350 : (isMobile ? 320 : 500);
  const formatValue = (value: unknown, key: string) => formatChartValue(value, key);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  if (!config || config.length === 0) return null;

  const renderChart = () => {
    if (chartType === 'pie') {
      const pieData = config.map(d => ({
        name: d.name,
        value: d[keys[0]] || 0
      }));

      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Tooltip
              wrapperStyle={{ pointerEvents: 'none' }}
              formatter={(value, name) => [formatValue(value, String(name)), String(name)]}
              contentStyle={{ backgroundColor: 'rgba(23, 23, 23, .95)', borderColor: 'var(--line)', color: '#fff', borderRadius: '8px', padding: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ color: 'var(--ink)', fontSize: '12px', marginTop: '10px' }} />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={isMobile ? 120 : "80%"}
              dataKey="value"
              label={(props: any) => {
                const { x, y, percent, textAnchor } = props;
                return (
                  <text 
                    x={x} 
                    y={y} 
                    fill="var(--muted)" 
                    fontSize={11} 
                    textAnchor={textAnchor}
                    dominantBaseline="central"
                  >
                    {`${((percent || 0) * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight} minWidth={500}>
          <AreaChart data={config} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={100} dx={-5} dy={10} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
            <Tooltip
              wrapperStyle={{ pointerEvents: 'none' }}
              formatter={(value, name) => [formatValue(value, String(name)), String(name)]}
              contentStyle={{ backgroundColor: 'rgba(23, 23, 23, .95)', borderColor: 'var(--line)', color: '#fff', borderRadius: '8px', padding: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)', fontSize: '12px' }} />
            {keys.map((key, index) => {
              const color = COLORS[index % COLORS.length];
              return (
                <Area 
                  key={key} 
                  type="monotone" 
                  dataKey={key} 
                  stroke={color} 
                  strokeWidth={2}
                  fill={color} 
                  fillOpacity={0.85}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight} minWidth={500}>
          <LineChart data={config} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={100} dx={-5} dy={10} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
            <Tooltip
              wrapperStyle={{ pointerEvents: 'none' }}
              formatter={(value, name) => [formatValue(value, String(name)), String(name)]}
              contentStyle={{ backgroundColor: 'rgba(23, 23, 23, .95)', borderColor: 'var(--line)', color: '#fff', borderRadius: '8px', padding: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)', fontSize: '12px' }} />
            {keys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={3}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'scatter') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight} minWidth={500}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" type="category" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={100} dx={-5} dy={10} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              wrapperStyle={{ pointerEvents: 'none' }}
              formatter={(value, name) => [formatValue(value, String(name)), String(name)]}
              contentStyle={{ backgroundColor: 'rgba(23, 23, 23, .95)', borderColor: 'var(--line)', color: '#fff', borderRadius: '8px', padding: '8px' }}
              itemStyle={{ color: '#fff', fontSize: '12px' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)', fontSize: '12px' }} />
            {keys.map((key, index) => (
              <Scatter 
                key={key} 
                name={key} 
                data={config} 
                fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    const isStacked = chartType === 'stacked';
    const isHorizontal = chartType === 'horizontal-bar';

    return (
      <ResponsiveContainer width="100%" height={chartHeight} minWidth={500}>
        <BarChart 
           data={config} 
           layout={isHorizontal ? "vertical" : "horizontal"}
           margin={{ top: 20, right: 30, left: 20, bottom: isHorizontal ? 5 : 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={!isHorizontal} horizontal={isHorizontal} />
          <XAxis 
            dataKey={isHorizontal ? undefined : "name"} 
            type={isHorizontal ? "number" : "category"}
            stroke="var(--muted)" 
            tick={{ fontSize: 11, fill: 'var(--muted)' }} 
            angle={isHorizontal ? 0 : -45}
            textAnchor={isHorizontal ? "middle" : "end"}
            height={isHorizontal ? 30 : 100}
            dx={isHorizontal ? 0 : -5}
            dy={isHorizontal ? 0 : 10}
          />
          <YAxis 
            dataKey={isHorizontal ? "name" : undefined}
            type={isHorizontal ? "category" : "number"}
            stroke="var(--muted)" 
            tick={{ fill: 'var(--muted)', fontSize: 12 }} 
            width={isHorizontal ? 130 : 40}
            hide={isHorizontal && isMobile}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.length > 15) {
                return value.substring(0, 15) + '...';
              }
              return value;
            }}
          />
          <Tooltip
            cursor={{ fill: 'var(--surface-2)' }}
            wrapperStyle={{ pointerEvents: 'none' }}
            formatter={(value, name) => [formatValue(value, String(name)), String(name)]}
            contentStyle={{ backgroundColor: 'rgba(23, 23, 23, .95)', borderColor: 'var(--line)', color: '#fff', borderRadius: '8px', padding: '8px' }}
            itemStyle={{ color: '#fff', fontSize: '12px' }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)', fontSize: '12px' }} />
          {keys.map((key, index) => {
            const color = COLORS[index % COLORS.length];
            return (
              <Bar 
                key={key} 
                dataKey={key} 
                stackId={isStacked ? "a" : undefined}
                fill={color} 
                fillOpacity={0.85}
                stroke={color}
                strokeWidth={1.5}
                radius={isStacked ? [0, 0, 0, 0] : (isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0])} 
                maxBarSize={50}
              >
                {isHorizontal && keys.length === 1 && (
                  <LabelList 
                    className="md:hidden" 
                    dataKey="name" 
                    fill="var(--ink)" 
                    offset={10} 
                    position="insideLeft" 
                    fontSize={11}
                    formatter={(v: any) => typeof v === 'string' && v.length > 15 ? v.substring(0, 15) + '...' : v}
                  />
                )}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const chartSummary: MediaSummary[] = keys.map((key, index) => ({
    label: key,
    color: COLORS[index % COLORS.length],
    value: (
      <div className="space-y-1">
        {config.map((row, rowIndex) => (
          <div key={`${key}-${rowIndex}`} className="flex justify-between gap-3">
            <span className="text-neutral-400">{String(row.name ?? `Row ${rowIndex + 1}`)}</span>
            <span>{formatValue(row[key], key)}</span>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <motion.div
      initial={animateOnce ? { opacity: 0, y: 30 } : false}
      whileInView={animateOnce ? { opacity: 1, y: 0 } : undefined}
      viewport={animateOnce ? { once: true, margin: "-50px" } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full my-8"
    >
      <div className="relative">
        {fullView && (
          <button
            type="button"
            onClick={() => setIsFullViewOpen(true)}
            aria-label="View chart full screen"
            className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]/90 text-[var(--ink)] shadow transition hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Maximize size={18} />
          </button>
        )}
        <div
        className={chartType !== 'pie' ? "w-full overflow-x-auto overflow-y-hidden touch-pan-x touch-pan-y no-scrollbar" : "w-full touch-pan-y"}
        style={chartType !== 'pie' ? { WebkitOverflowScrolling: "touch" } : undefined}
      >
        <div style={{ minWidth: chartType !== 'pie' ? 500 : '100%' }}>
          {renderChart()}
        </div>
      </div>
      </div>
      <MediaModal
        open={isFullViewOpen}
        onClose={() => setIsFullViewOpen(false)}
        title="Chart full view"
        media={<div className="w-[min(70vw,900px)] max-w-full">{renderChart()}</div>}
        summary={chartSummary}
      />
    </motion.div>
  );
}
