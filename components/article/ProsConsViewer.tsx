import React from 'react';
import { CheckCircle2, XCircle, Scale } from 'lucide-react';

interface Props {
  pros: string[];
  cons: string[];
}

export default function ProsConsViewer({ pros, cons }: Props) {
  const hasPros = Array.isArray(pros) && pros.length > 0;
  const hasCons = Array.isArray(cons) && cons.length > 0;

  if (!hasPros && !hasCons) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm my-6 font-sans overflow-hidden">
      {/* Admin-style Slim Header Strip */}
      <div className="bg-neutral-50 dark:bg-neutral-800/80 px-4 py-2 flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <Scale className="w-4 h-4 text-red-600 dark:text-red-500" />
        <span className="text-sm font-bold text-red-600 dark:text-red-500 m-0 uppercase tracking-wider">
          The Verdict
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5">

        {/* Pros Column */}
        {hasPros && (
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-emerald-500 mb-3 m-0">
              Pros
            </h4>
            <ul className="flex flex-col divide-y divide-emerald-500/10 m-0 p-0 list-none">
              {pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                  <CheckCircle2 className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5 drop-shadow-sm" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cons Column */}
        {hasCons && (
          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
            <h4 className="text-xs font-bold tracking-widest uppercase text-red-500 mb-3 m-0">
              Cons
            </h4>
            <ul className="flex flex-col divide-y divide-red-500/10 m-0 p-0 list-none">
              {cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 py-2 first:pt-0 last:pb-0">
                  <XCircle className="text-red-500 w-4 h-4 shrink-0 mt-0.5 drop-shadow-sm" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
