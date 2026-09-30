'use client';

import React, { useState, useMemo } from 'react';
import {
  Camera,
  Smile,
  Smartphone,
  Cpu,
  BatteryCharging,
  Volume2,
  Trophy,
  Sparkles,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import {
  calculateXSypherScore,
  BENCHMARK_TABS,
  type ScoreItem,
  type BenchmarkTab,
} from '@/lib/scoringEngine';

interface Props {
  items?: ScoreItem[];
  categories?: any[];
  overallScore?: number;
}

interface TabConfig {
  id: BenchmarkTab;
  label: string;
  icon: LucideIcon;
}

const TAB_CONFIGS: TabConfig[] = [
  { id: 'Camera', label: 'Camera', icon: Camera },
  { id: 'Selfie', label: 'Selfie', icon: Smile },
  { id: 'Display', label: 'Display', icon: Smartphone },
  { id: 'Performance', label: 'Performance', icon: Cpu },
  { id: 'Battery', label: 'Battery', icon: BatteryCharging },
  { id: 'Audio', label: 'Audio', icon: Volume2 },
];

interface CircularGaugeProps {
  score: number;
  max: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  showMax?: boolean;
}

function CircularGauge({
  score,
  max,
  label,
  size = 76,
  strokeWidth = 6,
  showMax = false,
}: CircularGaugeProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeMax = max > 0 ? max : 100;
  const percentage = Math.min(100, Math.max(0, (score / safeMax) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-neutral-200 dark:text-neutral-800"
          />
          {/* Active Gradient/Accent Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-red-600 dark:text-red-500 transition-all duration-700 ease-out"
            style={{
              transformOrigin: '50% 50%',
              transform: 'rotate(-90deg)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-bold text-neutral-900 dark:text-neutral-50 tracking-tight text-sm">
            {score}
          </span>
          {showMax && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium mt-0.5">
              /{max}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 text-center tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
}

interface ProgressBarProps {
  label: string;
  score: number;
  topScore: number;
  max: number;
}

function ProgressBar({ label, score, topScore, max }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const isRecord = score >= topScore && topScore > 0;
  const scorePct = Math.min(100, Math.max(0, (score / safeMax) * 100));
  const topPct = Math.min(100, Math.max(0, (topScore / safeMax) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
          {label}
          {isRecord && (
            <span title="Class-leading score" className="inline-flex">
              <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
            </span>
          )}
        </span>
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-neutral-900 dark:text-neutral-100">{score}</span>
          <span className="text-[10px] text-neutral-400 font-normal">(Top: {topScore})</span>
        </div>
      </div>

      <div className="h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden w-full relative">
        {/* Top Score Benchmark Marker / Ghost Bar */}
        <div
          className="h-full bg-neutral-300 dark:bg-neutral-700 rounded-full absolute top-0 left-0 transition-all duration-500"
          style={{ width: `${topPct}%` }}
        />
        {/* Device Foreground Score Bar */}
        <div
          className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full relative z-10 transition-all duration-700 ease-out"
          style={{ width: `${scorePct}%` }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdownViewer({ items, categories, overallScore: propOverallScore }: Props) {
  const dataList = items && items.length > 0 ? items : categories || [];

  // Determine initial active tab based on data presence
  const initialTab = useMemo(() => {
    if (!dataList || dataList.length === 0) return 'Camera';
    for (const conf of TAB_CONFIGS) {
      const hasTab = dataList.some(
        (it: any) => it.tab && String(it.tab).toLowerCase() === conf.id.toLowerCase()
      );
      if (hasTab) return conf.id;
    }
    return 'Camera';
  }, [dataList]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  if (!dataList || dataList.length === 0) return null;

  // Calculate full score breakdown for the active tab
  const breakdown = calculateXSypherScore(dataList, activeTab);
  const activeTabBreakdown =
    breakdown.tabs[activeTab] ||
    Object.values(breakdown.tabs).find(
      (t) => t.tab.toLowerCase() === activeTab.toLowerCase()
    );

  const currentScore = activeTabBreakdown?.score ?? breakdown.overallScore;
  const currentTopScore = activeTabBreakdown?.topScore ?? breakdown.overallTopScore;
  const currentScaleMax = activeTabBreakdown?.scaleMax ?? breakdown.scaleMax;
  const subCategories = activeTabBreakdown?.subCategories ?? breakdown.subCategories;
  const useCases = (activeTabBreakdown?.useCases ?? breakdown.useCases).slice(0, 3);

  const isTopTier = currentScore >= currentTopScore && currentTopScore > 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm my-6 font-sans overflow-hidden">
      {/* Header Strip */}
      <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-red-600 dark:text-red-500" />
          <span className="text-sm font-bold text-red-600 dark:text-red-500 uppercase tracking-wider">
            Benchmark Score Breakdown
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>xSypher Benchmark Engine</span>
        </div>
      </div>

      {/* 6 Filter Tabs Header Bar */}
      <div className="p-2 sm:p-3 bg-neutral-100/70 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon;
            const tabData = breakdown.tabs[tab.id];
            const hasData = Boolean(tabData && (tabData.subCategories.length > 0 || tabData.useCases.length > 0));
            const isActive = activeTab.toLowerCase() === tab.id.toLowerCase();

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2.5 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/20'
                    : hasData
                    ? 'bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 border border-neutral-200/80 dark:border-neutral-700/80'
                    : 'bg-white/50 dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : hasData ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`} />
                <span className="truncate">{tab.label}</span>
                {hasData && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-auto hidden sm:inline-block ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    {tabData.score}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Overview Section (Dynamically Calculated for Active Tab) */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-neutral-50/50 to-transparent dark:from-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-5">
            <CircularGauge
              score={currentScore}
              max={currentScaleMax}
              size={92}
              strokeWidth={8}
              showMax
            />
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                  {currentScore}
                  <span className="text-sm font-semibold text-neutral-400 dark:text-neutral-500 ml-1">
                    / {currentScaleMax}
                  </span>
                </span>
                {isTopTier && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Trophy className="w-3 h-3 text-amber-500" /> Top Performer
                  </span>
                )}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {activeTab} Overall Performance Rating
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm m-0">
                Weighted composite benchmark score calculated from verified laboratory and real-world evaluation metrics.
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="w-full sm:w-auto flex sm:flex-col justify-around sm:justify-center items-center sm:items-end gap-2 bg-neutral-100 dark:bg-neutral-800/60 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {activeTab.toUpperCase()} TOP SCORE
              </div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 sm:justify-end">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {currentTopScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: 2-Column Sub-Category Layout (e.g. Photo vs. Video) */}
      {subCategories.length > 0 ? (
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {subCategories.map((sub, i) => (
            <div
              key={i}
              className="bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs"
            >
              {/* Sub-Category Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500" />
                  <h4 className="m-0 text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    {sub.name}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xs">
                    {sub.score}
                  </span>
                  <span className="text-[11px] font-semibold text-neutral-400">
                    / {sub.topScore} top
                  </span>
                </div>
              </div>

              {/* Individual Metric Bars */}
              <div className="flex flex-col gap-3.5">
                {sub.metrics.map((metric, mi) => (
                  <ProgressBar
                    key={mi}
                    label={metric.metric}
                    score={metric.score}
                    topScore={metric.topScore ?? metric.score}
                    max={currentScaleMax}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-neutral-400 dark:text-neutral-500 italic">
          No sub-category benchmark metrics available for {activeTab}.
        </div>
      )}

      {/* Bottom Section: 3 Detailed Use-Case Circular Gauges */}
      {useCases.length > 0 && (
        <div className="p-5 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/20">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-1.5">
            <span>Evaluated Use Cases</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {useCases.map((uc, uci) => (
              <div
                key={uci}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-white dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/60 shadow-xs"
              >
                <CircularGauge
                  score={uc.score}
                  max={currentScaleMax}
                  size={76}
                  strokeWidth={6}
                  showMax={false}
                />
                <h5 className="mt-3 mb-1 text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {uc.label}
                </h5>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 m-0 leading-relaxed max-w-xs">
                  {uc.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
