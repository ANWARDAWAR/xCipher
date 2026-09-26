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
  ScatterChart,
  Scatter,
  ZAxis,
  LabelList
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

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
              contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--ink)' }}
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
            hide={isHorizontal && isMobile}
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
          <Legend verticalAlign="bottom" wrapperStyle={{ color: 'var(--ink)', fontSize: '12px' }} />
          {keys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              stackId={isStacked ? "a" : undefined}
              fill={COLORS[index % COLORS.length]} 
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
      className="w-full my-8"
    >
      <div 
        className={chartType !== 'pie' && chartType !== 'horizontal-bar' ? "w-full overflow-x-auto overflow-y-hidden snap-x" : "w-full"} 
        style={chartType !== 'pie' && chartType !== 'horizontal-bar' ? { WebkitOverflowScrolling: "touch", scrollbarWidth: "none" } : undefined}
      >
        <div style={{ minWidth: (chartType !== 'pie' && chartType !== 'horizontal-bar') ? 700 : '100%' }}>
          {renderChart()}
        </div>
      </div>
    </motion.div>
  );
}
