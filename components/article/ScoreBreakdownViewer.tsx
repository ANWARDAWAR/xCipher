import React from 'react';
import { BarChart3 } from 'lucide-react';

interface Props {
  categories: { label: string; score: number }[];
  overallScore: number;
}

export default function ScoreBreakdownViewer({ categories, overallScore }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm my-6 font-sans overflow-hidden">
      {/* Admin-style Slim Header Strip & Overall Score */}
      <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-red-600 dark:text-red-500" />
          <span className="text-sm font-bold text-red-600 dark:text-red-500 m-0 uppercase tracking-wider">
            Score Breakdown
          </span>
        </div>

        {/* Overall Score Badge */}
        <div className="bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow-sm">
          {overallScore.toFixed(1)} / 10
        </div>
      </div>

      {/* Category Rows */}
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        {categories.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            {/* Label & Score */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {item.label}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {item.score.toFixed(1)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden w-full">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, (item.score / 10) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
