import { Injectable } from "@nestjs/common";

type Entry<T> = { value: T; expiresAt: number };

/**
 * Process-local TTL cache + single-flight koruması.
 *
 * - `getOrSet(key, ttlMs, loader)` — aynı key için paralel istekler tek loader'ı bekler (stampede guard).
 * - `del(key)` / `delPrefix(prefix)` — mutation sonrası nokta atışı veya grup halinde invalidation.
 *
 * Multi-instance deploy'da bu modülün `ioredis` adapter'a çevrilmesi önerilir; API aynı kalır.
 */
@Injectable()
export class AppCacheService {
  private readonly store = new Map<string, Entry<unknown>>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  enabled = process.env.CACHE_ENABLED !== "off";

  get<T>(key: string): T | undefined {
    const e = this.store.get(key) as Entry<T> | undefined;
    if (!e) return undefined;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    if (!this.enabled) return;
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  delPrefix(prefix: string): void {
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) this.store.delete(k);
    }
  }

  clear(): void {
    this.store.clear();
  }

  async getOrSet<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    if (!this.enabled) return loader();
    const hit = this.get<T>(key);
    if (hit !== undefined) return hit;
    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) return pending;
    const p = (async () => {
      try {
        const value = await loader();
        this.set(key, value, ttlMs);
        return value;
      } finally {
        this.inflight.delete(key);
      }
    })();
    this.inflight.set(key, p);
    return p;
  }
}
