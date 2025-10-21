// Minimal `cn` helper used by UI components. Avoids extra dependencies for dev.
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}
