export type RenderStat = {
  id: string;
  name: string;
  count: number;
  lastRenderAt: number;
};

type Listener = () => void;

export class RenderStore {
  private stats = new Map<string, RenderStat>();
  private listeners = new Set<Listener>();
  private idListeners = new Map<string, Set<Listener>>();

  record(id: string, name: string, now: number): RenderStat {
    const prev = this.stats.get(id);
    const next: RenderStat = {
      id,
      name,
      count: (prev?.count ?? 0) + 1,
      lastRenderAt: now,
    };
    this.stats.set(id, next);
    this.emit(id);
    return next;
  }

  get(id: string): RenderStat | undefined {
    return this.stats.get(id);
  }

  getAll(): RenderStat[] {
    return Array.from(this.stats.values());
  }

  reset(): void {
    this.stats.clear();
    this.emitAll();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeId(id: string, listener: Listener): () => void {
    let set = this.idListeners.get(id);
    if (!set) {
      set = new Set();
      this.idListeners.set(id, set);
    }
    set.add(listener);
    return () => {
      set!.delete(listener);
    };
  }

  private emit(id: string): void {
    this.idListeners.get(id)?.forEach((l) => l());
    this.listeners.forEach((l) => l());
  }

  private emitAll(): void {
    this.idListeners.forEach((set) => set.forEach((l) => l()));
    this.listeners.forEach((l) => l());
  }
}

export const renderStore = new RenderStore();
