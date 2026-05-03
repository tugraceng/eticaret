import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

for (const envPath of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps", "backend", ".env"),
]) {
  loadEnv({ path: envPath, override: false });
}

/**
 * Prisma 6.13+ yapılandırması — `package.json#prisma` uyarısını kaldırır; Prisma 7 hazırlığı.
 * Config varken Prisma CLI varsayılan .env yüklemesini atlar; burada kök `.env` yüklenir.
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */
export default defineConfig({
  schema: path.join("database", "prisma", "schema.prisma"),
  migrations: {
    path: path.join("database", "prisma", "migrations"),
    seed: "tsx database/prisma/seed.ts",
  },
});
