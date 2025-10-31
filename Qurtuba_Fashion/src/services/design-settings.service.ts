export interface DesignOption {
  id: string;
  label: string;
}

type OptionGroupKey =
  | 'fabricType'
  | 'fabricSource'
  | 'collarType'
  | 'chestStyle'
  | 'sleeveEnd'
  | 'bunijaType';

interface DesignSettingsData {
  options: Partial<Record<OptionGroupKey, DesignOption[]>>;
  selected: Partial<Record<OptionGroupKey, string>>; // stores option id
}

/**
 * Persist design defaults (option lists and last selections) across sessions.
 * Uses Electron cache when available, falling back to localStorage.
 */
export class DesignSettingsService {
  private static instance: DesignSettingsService;
  private readonly STORAGE_KEY = 'qf_design_settings_v1';
  private listeners = new Set<(payload: { type: 'options' | 'selected'; key: OptionGroupKey }) => void>();

  static getInstance(): DesignSettingsService {
    if (!DesignSettingsService.instance) {
      DesignSettingsService.instance = new DesignSettingsService();
    }
    return DesignSettingsService.instance;
  }

  private read(): DesignSettingsData {
    // Default empty structure
    const fallback: DesignSettingsData = { options: {}, selected: {} };
    try {
      const api = (window as any)?.electronAPI;
      if (api?.cache?.readJson) {
        const res = api.cache.readJson(this.STORAGE_KEY);
        if (res && res.ok && res.data) return res.data as DesignSettingsData;
      }
    } catch {}
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return fallback;
      return JSON.parse(raw) as DesignSettingsData;
    } catch {
      return fallback;
    }
  }

  private write(data: DesignSettingsData): void {
    try {
      const api = (window as any)?.electronAPI;
      if (api?.cache?.writeJson) {
        void api.cache.writeJson(this.STORAGE_KEY, data);
      }
    } catch {}
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  private emit(payload: { type: 'options' | 'selected'; key: OptionGroupKey }) {
    try { for (const l of Array.from(this.listeners)) { try { l(payload); } catch {} } } catch {}
  }

  onChange(listener: (payload: { type: 'options' | 'selected'; key: OptionGroupKey }) => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  getOptions(key: OptionGroupKey): DesignOption[] {
    const d = this.read();
    return (d.options[key] || []) as DesignOption[];
  }

  setOptions(key: OptionGroupKey, options: DesignOption[]): void {
    const d = this.read();
    d.options[key] = options;
    // Clear selected id if it no longer exists in list
    const sel = d.selected[key];
    if (sel && !options.some(o => o.id === sel)) {
      delete d.selected[key];
    }
    this.write(d);
    this.emit({ type: 'options', key });
  }

  getSelectedId(key: OptionGroupKey): string | undefined {
    const d = this.read();
    return d.selected[key];
  }

  setSelectedId(key: OptionGroupKey, id: string | undefined): void {
    const d = this.read();
    if (id) d.selected[key] = id; else delete d.selected[key];
    this.write(d);
    this.emit({ type: 'selected', key });
  }
}

