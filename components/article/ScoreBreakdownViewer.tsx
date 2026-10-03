'use client';

import React, { useMemo } from 'react';
import {
  Camera,
  Smile,
  Smartphone,
  Cpu,
  BatteryCharging,
  Zap,
  Layers,
  Palette,
  Volume2,
  Wifi,
  Coins,
  Trophy,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import {
  calculateXSypherScore,
  isNAScore,
  type ScoreItem,
} from '@/lib/scoringEngine';

interface Props {
  items?: ScoreItem[] | string;
  categories?: any[];
  overallScore?: number;
  globalLeaderboard?: Record<string, { topScore: number, deviceName: string }>;
  deviceName?: string;
}

const CATEGORY_METADATA_MAP: Record<
  string,
  { icon: LucideIcon; subtext: string }
> = {
  camera: {
    icon: Camera,
    subtext: 'Evaluated in Lab Resolution & Dynamic Range, Normalized to Points',
  },
  selfie: {
    icon: Smile,
    subtext: 'Evaluated in Front Lens Clarity & Framing, Normalized to Points',
  },
  display: {
    icon: Smartphone,
    subtext: 'Evaluated in Peak Nits & Color Fidelity, Normalized to Points',
  },
  performance: {
    icon: Cpu,
    subtext: 'Evaluated in Sustained FPS & Thermals, Normalized to Points',
  },
  battery: {
    icon: BatteryCharging,
    subtext: 'Evaluated in Hours, Normalized to Points',
  },
  charging: {
    icon: Zap,
    subtext: 'Evaluated in Wattage & Fill Speed, Normalized to Points',
  },
  software: {
    icon: Layers,
    subtext: 'Evaluated in OS Fluidity & Support Longevity, Normalized to Points',
  },
  design: {
    icon: Palette,
    subtext: 'Evaluated in Ergonomics & Build Materials, Normalized to Points',
  },
  audio: {
    icon: Volume2,
    subtext: 'Evaluated in Frequency & dB Dynamic Range, Normalized to Points',
  },
  connectivity: {
    icon: Wifi,
    subtext: 'Evaluated in Throughput & Latency, Normalized to Points',
  },
  value: {
    icon: Coins,
    subtext: 'Price-to-Performance Ratio Index, Normalized to Points',
  },
};

function getCategoryMetadata(catKey: string): { icon: LucideIcon; subtext: string } {
  const lower = catKey.toLowerCase().trim();
  for (const [key, data] of Object.entries(CATEGORY_METADATA_MAP)) {
    if (lower.includes(key)) {
      return data;
    }
  }
  return {
    icon: BarChart3,
    subtext: 'Standardized Benchmark Evaluation, Normalized to Points',
  };
}

interface MetricBarProps {
  metric: ScoreItem;
  scaleMax?: number;
  globalLeaderboard?: Record<string, { topScore: number, deviceName: string }>;
  deviceName?: string;
}

function MetricBar({ metric, scaleMax = 200, globalLeaderboard, deviceName }: MetricBarProps) {
  const isNA = metric.isNA || isNAScore(metric.score);
  const label = metric.metric;
  const rawValue =
    metric.rawValue &&
    metric.rawValue.trim() !== '' &&
    metric.rawValue.trim().toLowerCase() !== 'n/a'
      ? metric.rawValue.trim()
      : null;

  if (isNA) {
    return (
      <div className="flex flex-col gap-1.5 opacity-40 select-none">
        <div className="flex justify-between items-center gap-2 mb-1.5">
          <div className="flex flex-col items-start gap-0.5 min-w-0">
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 leading-tight">{label}</span>
            {rawValue && (
              <span className="text-[9px] bg-neutral-200/50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                {rawValue}
              </span>
            )}
          </div>
          <div className="text-right whitespace-nowrap shrink-0">
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60">
              N/A
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full w-full overflow-hidden border border-neutral-200 dark:border-neutral-700/40 relative">
          <div className="h-full bg-neutral-300/40 dark:bg-neutral-700/25 w-full" />
        </div>
      </div>
    );
  }

  const scoreNum = Number(metric.score);
  const localTopScoreNum = isNAScore(metric.topScore) ? scoreNum : Number(metric.topScore);
  const safeMax = scaleMax > 0 ? scaleMax : 200;
  
  const globalRecord = globalLeaderboard?.[`${metric.tab}-${metric.subCategory}-${metric.metric}`];
  const topScoreNum = (globalRecord && globalRecord.topScore > localTopScoreNum) ? globalRecord.topScore : localTopScoreNum;
  const isClassLeader = globalRecord ? globalRecord.deviceName === deviceName : (scoreNum >= localTopScoreNum && localTopScoreNum > 0);
  const isRecord = isClassLeader || (scoreNum >= topScoreNum && topScoreNum > 0);
  // deviceScore is purely used for calculating the width of the Tailwind progress bar
  const scorePct = Math.min(100, Math.max(0, (scoreNum / safeMax) * 100));
  const topPct = Math.min(100, Math.max(0, (topScoreNum / safeMax) * 100));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center gap-2 mb-1.5">
        <div className="flex flex-col items-start gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 leading-tight">
            <span>{label}</span>
            {isRecord && (
              <span title="Class-leading score" className="inline-flex shrink-0">
                <Trophy className="w-3 h-3 text-amber-500" />
              </span>
            )}
          </span>
          {rawValue && (
            <span className="text-[9px] bg-neutral-200/50 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded truncate max-w-[140px]">
              {rawValue}
            </span>
          )}
        </div>
        <div className="text-right whitespace-nowrap shrink-0 flex flex-col items-end gap-0.5">
          <span className="text-xs font-bold text-neutral-900 dark:text-white leading-none">{scoreNum} / 200</span>
          {topScoreNum > 0 && (
            <span className="text-[9px] text-neutral-500 dark:text-neutral-400 font-normal block leading-none whitespace-nowrap">
              Top: {topScoreNum}
              {isClassLeader && <span className="ml-1 text-amber-500 font-bold">👑 Class Leader</span>}
              {!isClassLeader && globalRecord && (
                <span className="ml-1">({globalRecord.deviceName})</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden w-full relative border border-neutral-200/60 dark:border-transparent">
        {/* Top Score Benchmark Marker / Ghost Bar */}
        <div
          className="h-full bg-neutral-200 dark:bg-neutral-700 rounded-full absolute top-0 left-0 transition-all duration-500"
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

export default function ScoreBreakdownViewer({ items, categories, overallScore: propOverallScore, globalLeaderboard, deviceName }: Props) {
  const dataList: ScoreItem[] = useMemo(() => {
    let parsed: any = items;
    if (typeof items === 'string') {
      try {
        parsed = JSON.parse(items);
      } catch {
        parsed = [];
      }
    }
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (Array.isArray(categories) && categories.length > 0) return categories;
    return [];
  }, [items, categories]);

  const breakdown = useMemo(() => calculateXSypherScore(dataList), [dataList]);
  const groupedData = breakdown.categories || breakdown.tabs || {};
  const categoryKeys = Object.keys(groupedData);

  if (!dataList || dataList.length === 0 || categoryKeys.length === 0) {
    return null;
  }

  return (
    <div className="score-breakdown my-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 sm:p-4 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-red-600/10 border border-red-500/20 text-red-600 dark:text-red-500 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
                Benchmark Score Breakdown
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60 uppercase tracking-wider">
                0 – 200 Normalized Scale
              </span>
            </div>
            <div className="text-[10px] text-neutral-600 dark:text-neutral-400 m-0 mt-0.5">
              Comprehensive laboratory & field benchmarks across {categoryKeys.length} evaluated categories.
            </div>
          </div>
        </div>

        {/* Master Composite Score Pill */}
        <div className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 px-3 py-2 rounded-lg w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Composite Score
            </div>
            <div className="text-lg font-black text-neutral-900 dark:text-neutral-50 tracking-tight flex items-baseline gap-1 sm:justify-end">
              {propOverallScore ?? breakdown.overallScore}
              <span className="text-xs font-semibold text-neutral-500">/ 200</span>
            </div>
          </div>
          {breakdown.overallTopScore > 0 && (
            <div className="border-l border-neutral-200 dark:border-neutral-700 pl-4 text-left sm:text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Class Top
              </div>
              <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 sm:justify-end">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {breakdown.overallTopScore}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Master Full-Width Category Cards Stack */}
      <div className="flex flex-col gap-5 w-full items-stretch">
        {categoryKeys.map((catKey) => {
          const category = groupedData[catKey];
          const meta = getCategoryMetadata(catKey);
          const Icon = meta.icon;
          const isTopTier = category.score >= category.topScore && category.topScore > 0;

          return (
            <div
              key={catKey}
              className="break-inside-avoid bg-white dark:bg-[#1A1A1A] rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800/60 shadow-sm flex flex-col"
            >
              {/* Category Header */}
              <div className="flex justify-between items-start gap-4 mb-2">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-1.5 rounded-md bg-neutral-200/50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-base font-bold text-neutral-900 dark:text-white leading-none m-0">
                      {category.tab}
                    </div>
                    {isTopTier && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <Trophy className="w-3 h-3 text-amber-500" /> Top Tier
                      </span>
                    )}
                  </div>
                  {/* Category Contextual Sub-text */}
                  <div className="text-[10px] leading-snug text-neutral-500 dark:text-neutral-400 max-w-sm m-0">
                    {meta.subtext}
                  </div>
                </div>

                {/* Calculated Category Total Score out of 200 */}
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                      {category.score}
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-500">
                      / 200
                    </span>
                  </div>
                  {category.topScore > 0 && (
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 justify-end mt-0.5">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      Top: {category.topScore}
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-Categories & Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {category.subCategories.map((sub: any, sIdx: number) => {
                  const isGeneral =
                    sub.name.toLowerCase() === category.tab.toLowerCase() ||
                    sub.name.toLowerCase() === 'general';
                  
                  return (
                    <div
                      key={sIdx}
                      className={`bg-neutral-50 dark:bg-neutral-800/30 rounded-lg p-3.5 flex flex-col h-full border border-neutral-200/60 dark:border-neutral-800/60 ${
                        category.subCategories.length % 2 !== 0 ? 'last:md:col-span-2' : ''
                      }`}
                    >
                      {/* Sub-Category Header */}
                      {!isGeneral && (
                        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-neutral-800 dark:text-neutral-300 mb-3 border-b border-neutral-200 dark:border-neutral-800/60 pb-1.5 m-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                          {sub.name}
                          {sub.score > 0 && (
                            <span className="ml-auto text-[9px] font-bold text-neutral-500">
                              {sub.score} / 200
                            </span>
                          )}
                        </div>
                      )}

                      {/* Metric Rows */}
                      <div className="space-y-3">
                        {sub.metrics.map((metric: ScoreItem, mIdx: number) => (
                          <MetricBar
                            key={mIdx}
                            metric={metric}
                            scaleMax={category.scaleMax || 200}
                            globalLeaderboard={globalLeaderboard}
                            deviceName={deviceName}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Evaluated Use Cases Badges */}
              {category.useCases && category.useCases.length > 0 && (
                <div className="pt-4 mt-6 border-t border-neutral-200 dark:border-neutral-800/80 flex flex-wrap gap-2">
                  {category.useCases.map((uc: any, uIdx: number) => (
                    <div
                      key={uIdx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/50 text-[11px]"
                    >
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium">{uc.label}:</span>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">{uc.score}</span>
                      <span className="text-neutral-500 text-[10px]">/ 200</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
