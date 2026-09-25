"use client";

import React, { useMemo } from 'react';
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
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { motion } from 'framer-motion';

interface DynamicChartProps {
  config: any[];
  chartType: string;
  animateOnce?: boolean;
}

const COLORS = [
  'var(--accent)',
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export default function DynamicChart({ config, chartType, animateOnce = true }: DynamicChartProps) {
  const keys = useMemo(() => {
    if (!config || config.length === 0) return [];
    return Object.keys(config[0]).filter(k => k !== 'name');
  }, [config]);

  if (!config || config.length === 0) return null;

  const renderChart = () => {
    if (chartType === 'pie') {
      const pieData = config.map(d => ({
        name: d.name,
        value: d[keys[0]] || 0
      }));

      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--ink)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--ink)' }} />
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={config} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={100} dx={-5} dy={10} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--ink)' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)' }} />
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
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="name" type="category" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} angle={-45} textAnchor="end" height={100} dx={-5} dy={10} />
            <YAxis stroke="var(--muted)" tick={{ fill: 'var(--muted)' }} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--ink)' }}
            />
            <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)' }} />
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
      <ResponsiveContainer width="100%" height={500}>
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
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.length > 15) {
                return value.substring(0, 15) + '...';
              }
              return value;
            }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '8px' }}
            itemStyle={{ color: 'var(--ink)' }}
            cursor={{ fill: 'var(--surface-2)' }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)' }} />
          {keys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              stackId={isStacked ? "a" : undefined}
              fill={COLORS[index % COLORS.length]} 
              radius={isStacked ? [0, 0, 0, 0] : (isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0])} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <motion.div
      initial={animateOnce ? { opacity: 0, y: 30 } : false}
      whileInView={animateOnce ? { opacity: 1, y: 0 } : undefined}
      viewport={animateOnce ? { once: true, margin: "-50px" } : undefined}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full my-8 bg-[var(--surface-2)] p-4 sm:p-6 rounded-xl border border-[var(--line)] shadow-sm"
    >
      <div 
        className="w-full overflow-x-auto overflow-y-hidden snap-x" 
        style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}
      >
        <div style={{ minWidth: 700 }}>
          {renderChart()}
        </div>
      </div>
    </motion.div>
  );
}
