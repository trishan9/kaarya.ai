type StoredValue = {
  value: string;
  expiresAt?: number;
};

export class InMemoryRedis {
  private store = new Map<string, StoredValue>();

  reset() {
    this.store.clear();
  }

  private resolveEntry(key: string): StoredValue | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.resolveEntry(key);
    return entry ? entry.value : null;
  }

  async set(
    key: string,
    value: string,
    options?: { EX?: number },
  ): Promise<'OK'> {
    const entry: StoredValue = { value };
    if (options?.EX) {
      entry.expiresAt = Date.now() + options.EX * 1000;
    }
    this.store.set(key, entry);
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.resolveEntry(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remainingMs = entry.expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.store.delete(key);
      return -2;
    }
    return Math.ceil(remainingMs / 1000);
  }

  async incr(key: string): Promise<number> {
    const entry = this.resolveEntry(key);
    const current = entry ? Number(entry.value) : 0;
    const next = Number.isFinite(current) ? current + 1 : 1;
    this.store.set(key, { value: `${next}` });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.resolveEntry(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return 1;
  }
}
