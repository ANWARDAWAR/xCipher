interface ReadingTimeData {
  wordCount?: number | null;
  readingTime?: number | null;
  mins?: number | null;
}

export function getReadingTimeMinutes(article: ReadingTimeData): number {
  if (typeof article.wordCount === "number" && Number.isFinite(article.wordCount) && article.wordCount >= 0) {
    return Math.max(1, Math.ceil(article.wordCount / 200));
  }
  for (const minutes of [article.readingTime, article.mins]) {
    if (typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0) {
      return Math.max(1, Math.ceil(minutes));
    }
  }
  return 1;
}
