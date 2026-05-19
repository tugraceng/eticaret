import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import express from "express";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/http/global-exception.filter";
import { perfMiddleware } from "./common/perf/perf.middleware";
import { UploadsService } from "./uploads/uploads.service";

/** .env içindeki UPLOAD_DIR=uploads → apps/backend/uploads hatasını önler */
function ensureUploadDirEnv(): void {
  const repo = resolve(__dirname, "../../../uploads");
  const d = process.env.UPLOAD_DIR?.trim();
  if (!d || d === "uploads" || d === "./uploads") {
    process.env.UPLOAD_DIR = repo;
    return;
  }
  if (!d.startsWith("/") && !/^[a-zA-Z]:[/\\]/.test(d)) {
    process.env.UPLOAD_DIR = repo;
  }
}

function parseOriginList(raw: string | undefined): string[] {
  const list = (raw ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : ["http://localhost:3000"];
}

function buildCorsOptions(): CorsOptions {
  const isProd = process.env.NODE_ENV === "production";
  const list = parseOriginList(process.env.CORS_ORIGIN);

  if (!isProd) {
    return {
      credentials: true,
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (list.includes(origin)) return cb(null, true);
        try {
          const u = new URL(origin);
          if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]") {
            return cb(null, true);
          }
        } catch {
          /* ignore */
        }
        return cb(null, false);
      },
    };
  }

  return {
    credentials: true,
    origin: list.length === 1 ? list[0] : list,
  };
}

async function bootstrap() {
  ensureUploadDirEnv();
  const uploadSvc = new UploadsService();
  uploadSvc.ensureUploadDir();
  const uploadDir = uploadSvc.getUploadDir();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.TRUST_PROXY === "1" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }
  app.use(
    "/uploads",
    express.static(uploadDir, {
      index: false,
      maxAge: "7d",
    }),
  );
  app.use(perfMiddleware);
  app.enableCors(buildCorsOptions());
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`[uploads] dir=${uploadDir} exists=${existsSync(uploadDir)}`);
}

bootstrap();
