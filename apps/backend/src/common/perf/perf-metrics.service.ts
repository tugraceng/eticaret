import { Injectable, Logger } from "@nestjs/common";

export type PerfSample = {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  requestId: string;
  userId?: string;
  queryCount: number;
};

type Agg = {
  count: number;
  sumMs: number;
  maxMs: number;
  p50: number;
  p95: number;
  p99: number;
  over1ms: number;
  over5ms: number;
  over20ms: number;
  over100ms: number;
  // son 500 örneğin döngüsel tamponu
  samples: number[];
};

const SAMPLE_LIMIT = 500;

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/**
 * Endpoint bazlı latency istatistikleri. Process içinde biriktirir,
 * admin-only `GET /api/internal/perf-stats` ile dışa verir.
 */
@Injectable()
export class PerfMetricsService {
  private readonly logger = new Logger("Perf");
  private readonly slowThresholdMs = Number(process.env.PERF_SLOW_MS ?? 20);
  private readonly structuredLogs = process.env.PERF_LOG !== "off";
  private readonly store = new Map<string, Agg>();

  record(sample: PerfSample) {
    const key = `${sample.method} ${this.normalizePath(sample.path)}`;
    let agg = this.store.get(key);
    if (!agg) {
      agg = {
        count: 0,
        sumMs: 0,
        maxMs: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        over1ms: 0,
        over5ms: 0,
        over20ms: 0,
        over100ms: 0,
        samples: [],
      };
      this.store.set(key, agg);
    }
    agg.count += 1;
    agg.sumMs += sample.durationMs;
    if (sample.durationMs > agg.maxMs) agg.maxMs = sample.durationMs;
    if (sample.durationMs > 1) agg.over1ms += 1;
    if (sample.durationMs > 5) agg.over5ms += 1;
    if (sample.durationMs > 20) agg.over20ms += 1;
    if (sample.durationMs > 100) agg.over100ms += 1;
    if (agg.samples.length >= SAMPLE_LIMIT) agg.samples.shift();
    agg.samples.push(sample.durationMs);

    if (this.structuredLogs) {
      const line = JSON.stringify({
        t: "http",
        method: sample.method,
        path: sample.path,
        status: sample.statusCode,
        durationMs: Number(sample.durationMs.toFixed(3)),
        queryCount: sample.queryCount,
        userId: sample.userId,
        requestId: sample.requestId,
      });
      if (sample.durationMs >= this.slowThresholdMs) {
        this.logger.warn(line);
      } else {
        this.logger.log(line);
      }
    }
  }

  snapshot() {
    const rows = [...this.store.entries()].map(([key, agg]) => {
      const sorted = [...agg.samples].sort((a, b) => a - b);
      agg.p50 = percentile(sorted, 50);
      agg.p95 = percentile(sorted, 95);
      agg.p99 = percentile(sorted, 99);
      return {
        endpoint: key,
        count: agg.count,
        avgMs: agg.count ? +(agg.sumMs / agg.count).toFixed(3) : 0,
        maxMs: +agg.maxMs.toFixed(3),
        p50Ms: +agg.p50.toFixed(3),
        p95Ms: +agg.p95.toFixed(3),
        p99Ms: +agg.p99.toFixed(3),
        over1ms: agg.over1ms,
        over5ms: agg.over5ms,
        over20ms: agg.over20ms,
        over100ms: agg.over100ms,
      };
    });
    rows.sort((a, b) => b.p95Ms - a.p95Ms);
    return {
      generatedAt: new Date().toISOString(),
      endpoints: rows,
      totals: {
        endpoints: rows.length,
        requests: rows.reduce((acc, r) => acc + r.count, 0),
        over1ms: rows.reduce((acc, r) => acc + r.over1ms, 0),
        over5ms: rows.reduce((acc, r) => acc + r.over5ms, 0),
        over20ms: rows.reduce((acc, r) => acc + r.over20ms, 0),
        over100ms: rows.reduce((acc, r) => acc + r.over100ms, 0),
      },
    };
  }

  reset() {
    this.store.clear();
  }

  /** :id / :slug gibi path parametrelerini grupla. */
  private normalizePath(path: string): string {
    const clean = path.split("?")[0];
    return clean
      .split("/")
      .map((seg) => {
        if (!seg) return seg;
        if (/^c[a-z0-9]{20,}$/i.test(seg)) return ":id"; // cuid
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg))
          return ":id";
        if (/^\d+$/.test(seg)) return ":id";
        return seg;
      })
      .join("/");
  }
}
