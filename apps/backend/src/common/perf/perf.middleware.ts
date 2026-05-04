import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { perfContext, type PerfStore } from "./request-context";

/**
 * Express-level middleware. AsyncLocalStorage store'u açar ve requestId üretir.
 * Interceptor (veya response finish) üzerinden duration ölçülür.
 */
export function perfMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.length < 200 ? incoming : randomUUID();
  res.setHeader("x-request-id", requestId);

  const store: PerfStore = {
    requestId,
    startNs: process.hrtime.bigint(),
    queryCount: 0,
  };
  perfContext.run(store, () => {
    next();
  });
}
