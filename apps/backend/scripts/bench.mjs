#!/usr/bin/env node
/**
 * Basit autocannon tabanlı benchmark koşucusu.
 *
 *   npm run bench:cold   # her endpoint'e önce sadece 1 istek (warmup yok)
 *   npm run bench:warm   # 5s warmup, sonra 30s yük; p50/p95/p99 + throughput
 *
 * Ek seçenekler:
 *   --url=http://localhost:4000        (default)
 *   --duration=30                       (sn)
 *   --connections=50
 *   --group=public|auth|all             (default: all)
 *
 * Bench sırasında perf metrikleri resetlemek için:
 *   curl -X DELETE -H "Authorization: Bearer <ADMIN_JWT>" \
 *        http://localhost:4000/api/internal/perf-stats
 *
 * Sonra sonuçları çekmek için:
 *   curl -H "Authorization: Bearer <ADMIN_JWT>" \
 *        http://localhost:4000/api/internal/perf-stats
 */

import autocannon from "autocannon";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);

const base = (args.url ?? "http://localhost:4000").replace(/\/$/, "");
const mode = args.mode ?? "warm";
const group = args.group ?? "all";
const duration = Number(args.duration ?? (mode === "cold" ? 3 : 30));
const connections = Number(args.connections ?? (mode === "cold" ? 1 : 50));

const publicTargets = [
  ["GET /api/categories", "/api/categories"],
  ["GET /api/settings", "/api/settings"],
  ["GET /api/home-sections", "/api/home-sections"],
  ["GET /api/shipping-rates", "/api/shipping-rates"],
  ["GET /api/products/bestsellers?limit=8", "/api/products/bestsellers?limit=8"],
  ["GET /api/products/catalog?page=1&limit=24", "/api/products/catalog?page=1&limit=24"],
  ["GET /api/cms/blog", "/api/cms/blog"],
  ["GET /api/cms/services", "/api/cms/services"],
];

const authTargets = [
  // İstek gövdeleri gerçek kullanıcıya göre güncellenmeli.
  [
    "POST /api/auth/login (bcrypt)",
    {
      method: "POST",
      path: "/api/auth/login",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "demo@example.com", password: "demo12345" }),
    },
  ],
];

const chosen =
  group === "auth"
    ? authTargets
    : group === "public"
      ? publicTargets
      : [...publicTargets, ...authTargets];

console.log(`# bench mode=${mode} duration=${duration}s connections=${connections} base=${base}`);
console.log(`# hedef sayısı: ${chosen.length}\n`);

const results = [];

for (const [label, target] of chosen) {
  const opts =
    typeof target === "string"
      ? { url: base + target, duration, connections, pipelining: 1 }
      : { url: base + target.path, duration, connections, pipelining: 1, ...target };
  try {
    const r = await autocannon(opts);
    results.push({ label, r });
    console.log(
      `${label.padEnd(48)} ` +
        `req/s=${r.requests.average.toFixed(0).padStart(6)} ` +
        `p50=${r.latency.p50?.toFixed(2) ?? "?"}ms ` +
        `p95=${(r.latency.p97_5 ?? r.latency.p99)?.toFixed(2) ?? "?"}ms ` +
        `p99=${r.latency.p99?.toFixed(2) ?? "?"}ms ` +
        `max=${r.latency.max?.toFixed(2) ?? "?"}ms ` +
        `non2xx=${r.non2xx}`,
    );
  } catch (e) {
    console.error(`${label} -> hata:`, e instanceof Error ? e.message : e);
  }
}

console.log("\nTamam. /api/internal/perf-stats üzerinden backend-side sayaçları alabilirsiniz.");
