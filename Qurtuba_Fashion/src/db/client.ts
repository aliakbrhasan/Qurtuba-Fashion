// Local-only: provide a minimal stub to avoid runtime errors
export const supabase = {
  from() {
    return {
      select: () => ({ data: null, error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ data: null, error: null }),
      upsert: () => ({ data: null, error: null }),
      eq: () => ({ data: null, error: null }),
      order: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
      maybeSingle: () => ({ data: null, error: null }),
    } as any;
  },
} as any;

