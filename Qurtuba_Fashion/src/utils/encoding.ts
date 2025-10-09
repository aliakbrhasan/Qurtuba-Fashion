// Encoding utilities to remediate Arabic mojibake issues in legacy data

const ARABIC_REGEX = /[\u0600-\u06FF]/;

export function containsArabic(text: string | null | undefined): boolean {
  if (!text) return false;
  return ARABIC_REGEX.test(text);
}

// Attempt to reverse common mojibake like "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…"
// caused by UTF-8 bytes interpreted as ISO-8859-1/Windows-1252.
export function fixMojibake(text: string): string {
  try {
    // If it already has Arabic, return as-is
    if (containsArabic(text)) return text;

    // Convert each code unit (0..255) to a byte and decode as UTF-8
    const bytes = Uint8Array.from(Array.from(text, (ch) => ch.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return containsArabic(decoded) ? decoded : text;
  } catch {
    return text;
  }
}

export function sanitizeArabicText(value: string | null | undefined): string {
  if (value == null) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return fixMojibake(trimmed);
}

// Helper sanitizers for entities shown on Roles page
export function sanitizePage<T extends { name: string; description?: string }>(page: T): T {
  return {
    ...page,
    name: sanitizeArabicText(page.name),
    description: sanitizeArabicText(page.description as any) as any,
  };
}

export function sanitizeAction<T extends { name: string; description?: string; category?: string }>(action: T): T {
  return {
    ...action,
    name: sanitizeArabicText(action.name),
    description: sanitizeArabicText(action.description as any) as any,
    category: sanitizeArabicText(action.category as any) as any,
  };
}

export function sanitizeRole<T extends { name: string; description?: string }>(role: T): T {
  return {
    ...role,
    name: sanitizeArabicText(role.name),
    description: sanitizeArabicText(role.description as any) as any,
  };
}


