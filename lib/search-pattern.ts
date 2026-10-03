/** Escape PostgreSQL LIKE metacharacters while preserving literal search text. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, character => `\\${character}`);
}
