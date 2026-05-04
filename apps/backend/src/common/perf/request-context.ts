import { AsyncLocalStorage } from "node:async_hooks";

export type PerfStore = {
  requestId: string;
  startNs: bigint;
  queryCount: number;
  userId?: string;
};

/**
 * Request başına performans bilgilerini taşıyan AsyncLocalStorage.
 * Middleware ilk açar, interceptor ve Prisma query event'i içine yazar.
 */
export const perfContext = new AsyncLocalStorage<PerfStore>();

export function getPerfStore(): PerfStore | undefined {
  return perfContext.getStore();
}

export function bumpQueryCount(n = 1) {
  const s = perfContext.getStore();
  if (s) s.queryCount += n;
}
