"use client";

import { useState } from "react";
import { showToast } from "@/lib/utils";
import { updatePublicationSettings } from "@/app/actions/settings";
import type { ResolvedSettings } from "@/lib/settings-defaults";

// ─────────────────────────────────────────────────────────────────────────────
// Publication identity form.
//
// Every field shows the currently-effective value as a placeholder rather than
// pre-filling it. That distinction matters here: an empty input means "use the
// default", and pre-filling would make a never-configured install look
// configured, so clearing a field to restore the default would be impossible to
// discover.
// ─────────────────────────────────────────────────────────────────────────────

interface PublicationFormProps {
  settings: ResolvedSettings;
  // The stored row, which is null for fields that have never been set. This is
  // what populates the inputs -- not the resolved values above.
  stored: Partial<Record<keyof ResolvedSettings, string | null>>;
}

type FieldKey =
  | "siteName"
  | "tagline"
  | "description"
  | "logoUrl"
  | "faviconUrl"
  | "twitterHandle"
  | "publisherName"
  | "defaultOgImage"
  | "footerText";

const FIELDS: Array<{
  key: FieldKey;
  label: string;
  hint?: string;
  multiline?: boolean;
}> = [
  { key: "siteName", label: "Publication name" },
  {
    key: "tagline",
    label: "Tagline",
    hint: "Appended to the publication name in the browser title.",
  },
  {
    key: "description",
    label: "Meta description",
    multiline: true,
    hint: "Used by search engines and link previews.",
  },
  { key: "publisherName", label: "Publisher" },
  {
    key: "twitterHandle",
    label: "X / Twitter handle",
    hint: "Including the @.",
  },
  {
    key: "logoUrl",
    label: "Logo URL",
    hint: "Must be hosted on an approved media domain.",
  },
  { key: "faviconUrl", label: "Favicon URL" },
  {
    key: "defaultOgImage",
    label: "Default social share image",
    hint: "Shown when an article has no image of its own.",
  },
  { key: "footerText", label: "Footer text", multiline: true },
];

export default function PublicationForm({ settings, stored }: PublicationFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.key, stored[f.key] ?? ""]))
  );
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await updatePublicationSettings(values);
      if (res.success) {
        showToast("Publication settings saved.");
      } else {
        showToast(`Error: ${res.error || "Failed to save settings"}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save settings";
      showToast(`Error: ${msg}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="cs-settings-section">
      <div className="cs-settings-section-label">Publication identity</div>
      <div className="cs-settings-body">
        <p className="cs-sub" style={{ marginBottom: 20 }}>
          These appear across the public site and in link previews. Leave a field
          empty to use the built-in default, shown in grey.
        </p>

        <form onSubmit={handleSubmit} className="cs-settings-grid">
          {FIELDS.map((f) => {
            const effective = settings[f.key];
            const placeholder =
              typeof effective === "string" && effective
                ? effective
                : "Not set";
            return (
              <div key={f.key} className={f.multiline ? "cs-settings-full" : undefined}>
                <label className="ed-label" htmlFor={`pub-${f.key}`}>
                  {f.label}
                </label>
                {f.multiline ? (
                  <textarea
                    id={`pub-${f.key}`}
                    className="ed-input"
                    rows={3}
                    value={values[f.key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    id={`pub-${f.key}`}
                    type="text"
                    className="ed-input"
                    value={values[f.key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                )}
                {f.hint && (
                  <p className="cs-sub" style={{ fontSize: 12, marginTop: 4 }}>
                    {f.hint}
                  </p>
                )}
              </div>
            );
          })}

          <div className="cs-settings-full">
            <button type="submit" className="btn-cs primary" disabled={isPending}>
              {isPending ? "Saving…" : "Save publication settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
