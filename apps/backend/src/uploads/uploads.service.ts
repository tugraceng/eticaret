import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { Injectable } from "@nestjs/common";

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/x-icon",
  "image/vnd.microsoft.icon",
]);

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
};

/** dist/uploads/*.js → repo kökü uploads/ (process.cwd bağımsız) */
export function resolveRepoUploadsDir(): string {
  return resolve(__dirname, "../../../../uploads");
}

@Injectable()
export class UploadsService {
  /** Yerel veya mutlak klasör yolu. Göreli `uploads` her zaman repo köküne çözülür. */
  getUploadDir(): string {
    const repo = resolveRepoUploadsDir();
    const d = process.env.UPLOAD_DIR?.trim();
    if (!d) return repo;
    if (d === "uploads" || d === "./uploads") return repo;
    if (d.startsWith("/") || /^[a-zA-Z]:[/\\]/.test(d)) return d;
    return resolve(repo, d);
  }

  ensureUploadDir(): void {
    const dir = this.getUploadDir();
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  publicUrl(filename: string): string {
    return `/uploads/${encodeURIComponent(filename)}`;
  }

  buildFilename(originalname: string, mimetype: string): string {
    const fromMime = MIME_EXT[mimetype];
    const fromName = extname(originalname).toLowerCase();
    const ext =
      fromName && fromName.length <= 5 && fromName !== "." ? fromName : (fromMime ?? ".bin");
    return `${Date.now()}-${randomBytes(10).toString("hex")}${ext}`;
  }
}
