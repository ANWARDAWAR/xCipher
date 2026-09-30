import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  scores: { category: string; score: number }[];
  totalScore: number;
}

export default function ScoreBreakdownViewer({ scores, totalScore }: Props) {
  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'bg-green-500';
    if (score >= 7) return 'bg-blue-500';
    if (score >= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const totalColor = getScoreColor(totalScore);

  return (
    <div className="my-8 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-6 shadow-sm font-sans flex flex-col md:flex-row gap-8 items-center">
      
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center shrink-0">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Circular Background */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle 
              cx="64" cy="64" r="56" 
              className="text-[var(--line)]" 
              strokeWidth="12" fill="none" stroke="currentColor"
            />
            <circle 
              cx="64" cy="64" r="56" 
              className={totalColor.replace('bg-', 'text-')} 
              strokeWidth="12" fill="none" stroke="currentColor"
              strokeDasharray="351.86" // 2 * pi * 56
              strokeDashoffset={351.86 - (351.86 * (totalScore / 10))}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="flex flex-col items-center z-10">
            <span className="text-4xl font-black text-[var(--ink)] leading-none tracking-tighter">
              {totalScore.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mt-1">
              Out of 10
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 mt-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={`w-4 h-4 ${star <= (totalScore / 2) ? totalColor.replace('bg-', 'text-').replace('500', '400') : 'text-[var(--line)]'} ${star <= (totalScore / 2) ? 'fill-current' : ''}`} 
            />
          ))}
        </div>
      </div>
      
      {/* Breakdown */}
      <div className="flex-1 w-full flex flex-col gap-4">
        <h3 className="m-0 text-lg font-bold text-[var(--ink)] mb-1 border-b border-[var(--line)] pb-3">
          Score Breakdown
        </h3>
        
        {scores.map((item, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex justify-between items-end text-sm">
              <span className="font-semibold text-[var(--ink)]">{item.category}</span>
              <span className="font-bold text-[var(--muted)]">{item.score} / 10</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getScoreColor(item.score)}`}
                style={{ width: `${(item.score / 10) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
