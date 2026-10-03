"use client";

import Image from "next/image";
import { getPersonaForCategory } from "@/lib/personas";

export default function EditorialPersonaSettings({ isAnonymous, categorySlug, parentSlug, authorName, onChange }: {
  isAnonymous: boolean;
  categorySlug?: string;
  parentSlug?: string;
  authorName: string;
  onChange: (value: boolean) => void;
}) {
  const persona = getPersonaForCategory(categorySlug, parentSlug);
  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-3 space-y-3">
      <label className="flex items-center justify-between gap-3 cursor-pointer text-sm font-medium text-[var(--ink)]">
        <span>Publish as Editorial Desk (Anonymous)</span>
        <input type="checkbox" role="switch" checked={isAnonymous} onChange={event => onChange(event.target.checked)} className="peer sr-only" />
        <span aria-hidden="true" className="relative h-5 w-9 shrink-0 rounded-full bg-[var(--line)] transition-colors peer-checked:bg-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
      </label>
      <div aria-live="polite" className="flex items-start gap-2 text-xs text-[var(--muted)]">
        {isAnonymous && <Image src={persona.avatar} alt="" width={32} height={32} className="rounded-full shrink-0" />}
        <div>
          <span className="block font-semibold text-[var(--ink)]">Public byline: {isAnonymous ? persona.name : authorName}</span>
          {isAnonymous && <p className="mt-1 leading-relaxed">{persona.bio}</p>}
        </div>
      </div>
    </div>
  );
}
