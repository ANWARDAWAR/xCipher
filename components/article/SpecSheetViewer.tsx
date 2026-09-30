import React from 'react';
import { List } from 'lucide-react';

interface Props {
  specs: { label: string; value: string }[];
}

export default function SpecSheetViewer({ specs }: Props) {
  return (
    <div className="my-8 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] overflow-hidden shadow-sm font-sans">
      <div className="bg-[var(--surface)] px-5 py-3 border-b border-[var(--line)] flex items-center gap-2">
        <List className="w-5 h-5 text-[var(--accent)]" />
        <h3 className="m-0 text-base font-bold text-[var(--ink)]">Specifications</h3>
      </div>
      <div className="p-0">
        <table className="w-full text-sm m-0 border-collapse">
          <tbody>
            {specs.map((spec, i) => (
              <tr 
                key={i} 
                className={`border-b border-[var(--line)] last:border-0 ${i % 2 === 0 ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}`}
              >
                <td className="py-3 px-5 font-semibold text-[var(--ink)] w-1/3 align-top">
                  {spec.label}
                </td>
                <td className="py-3 px-5 text-[var(--muted)] align-top leading-snug">
                  {spec.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
