import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { bumpQueryCount } from "../common/perf/request-context";

/**
 * NestJS Prisma wrapper. PERF_QUERY_LOG=1 iken her sorguda
 * isteğin ALS context'inde `queryCount` artırılır (perf raporu için).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const enableQueryEvent = process.env.PERF_QUERY_LOG !== "off";
    super(
      enableQueryEvent
        ? {
            log: [
              { level: "query", emit: "event" },
              { level: "warn", emit: "stdout" },
              { level: "error", emit: "stdout" },
            ],
          }
        : undefined,
    );

    if (enableQueryEvent) {
      // Prisma'nın emit tipleri generic değil; runtime güvenli cast.
      (this as unknown as { $on: (e: string, cb: () => void) => void }).$on(
        "query",
        () => bumpQueryCount(1),
      );
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
