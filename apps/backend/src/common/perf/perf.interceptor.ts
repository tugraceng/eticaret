import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { getPerfStore } from "./request-context";
import { PerfMetricsService } from "./perf-metrics.service";

@Injectable()
export class PerfInterceptor implements NestInterceptor {
  constructor(private readonly metrics: PerfMetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: { sub?: string } }>();
    const res = http.getResponse<Response>();
    const store = getPerfStore();
    const startNs = store?.startNs ?? process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.finish(req, res, startNs, store, res.statusCode),
        error: (err: { status?: number; getStatus?: () => number }) => {
          const status =
            (typeof err?.getStatus === "function" ? err.getStatus() : err?.status) ?? 500;
          this.finish(req, res, startNs, store, status);
        },
      }),
    );
  }

  private finish(
    req: Request & { user?: { sub?: string } },
    res: Response,
    startNs: bigint,
    store: ReturnType<typeof getPerfStore>,
    statusCode: number,
  ) {
    const endNs = process.hrtime.bigint();
    const durationMs = Number(endNs - startNs) / 1e6;
    const route =
      (req as unknown as { route?: { path?: string } }).route?.path ?? req.originalUrl ?? req.url;
    const baseUrl = (req as unknown as { baseUrl?: string }).baseUrl ?? "";
    const path = baseUrl ? `${baseUrl}${route}` : route;
    this.metrics.record({
      method: req.method,
      path,
      statusCode,
      durationMs,
      requestId: store?.requestId ?? "",
      userId: req.user?.sub,
      queryCount: store?.queryCount ?? 0,
    });
  }
}
