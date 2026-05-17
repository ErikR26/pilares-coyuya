/**
 * Strips HTML tags from user input before storing to Supabase,
 * preventing stored XSS. Works in both browser and SSR contexts.
 */
export function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')        // remove any <tag ...>
    .replace(/&[a-z#0-9]+;/gi, ' ') // neutralize HTML entities
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim();
}
