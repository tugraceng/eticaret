import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { AppModule } from "./app.module";
import { UploadsService } from "./uploads/uploads.service";

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
  const uploadSvc = new UploadsService();
  uploadSvc.ensureUploadDir();
  const uploadDir = uploadSvc.getUploadDir();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(uploadDir, { prefix: "/uploads/" });
  app.enableCors(buildCorsOptions());
  app.setGlobalPrefix("api");
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
}

bootstrap();
