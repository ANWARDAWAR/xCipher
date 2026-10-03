export function formatChartValue(value: unknown, key: string, prefix = "", suffix = ""): string {
  const text = String(value ?? "");
  const normalizedKey = key.toLowerCase();

  if (prefix || suffix) return `${prefix}${text}${suffix}`;
  if (normalizedKey.includes("price")) return `$${text}`;
  if (normalizedKey.includes("battery")) return `${text} mAh`;
  if (normalizedKey.includes("charging")) return `${text} W`;
  if (
    normalizedKey.includes("geekbench") ||
    normalizedKey.includes("score") ||
    normalizedKey.includes("performance")
  ) {
    return `${text} pts`;
  }
  if (normalizedKey.includes("drop") || normalizedKey.includes("throttling")) {
    return `${text}%`;
  }

  return text;
}
