import React from 'react';
import { Plus, Minus, Check, X } from 'lucide-react';

interface Props {
  pros: string[];
  cons: string[];
}

export default function ProsConsViewer({ pros, cons }: Props) {
  return (
    <div className="my-8 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden shadow-sm font-sans">
      <div className="bg-[var(--surface)] px-5 py-3 border-b border-[var(--line)] flex items-center justify-between">
        <h3 className="m-0 text-base font-bold text-[var(--ink)]">The Verdict</h3>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--line)]">
        
        {/* Pros */}
        <div className="p-5">
          <h4 className="text-green-500 font-bold flex items-center gap-2 mt-0 mb-4 text-base">
            <span className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <Check className="w-3.5 h-3.5" />
            </span>
            Pros
          </h4>
          <ul className="flex flex-col gap-3 m-0 p-0 list-none">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--ink)]">
                <Plus className="w-4 h-4 text-green-500 mt-0.5 shrink-0 opacity-70" />
                <span className="leading-snug">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Cons */}
        <div className="p-5">
          <h4 className="text-red-500 font-bold flex items-center gap-2 mt-0 mb-4 text-base">
            <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <X className="w-3.5 h-3.5" />
            </span>
            Cons
          </h4>
          <ul className="flex flex-col gap-3 m-0 p-0 list-none">
            {cons.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[var(--ink)]">
                <Minus className="w-4 h-4 text-red-500 mt-0.5 shrink-0 opacity-70" />
                <span className="leading-snug">{c}</span>
              </li>
            ))}
          </ul>
        </div>
        
      </div>
    </div>
  );
}
