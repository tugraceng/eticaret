import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Express } from "express";
import { diskStorage } from "multer";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { ALLOWED_IMAGE_MIMES, UploadsService } from "./uploads.service";

const uploadStorageService = new UploadsService();

@Controller("uploads")
@UseGuards(JwtAuthGuard, AdminGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            uploadStorageService.ensureUploadDir();
            cb(null, uploadStorageService.getUploadDir());
          } catch {
            cb(new BadRequestException("Upload klasoru olusturulamadi."), "");
          }
        },
        filename: (_req, file, cb) => {
          try {
            cb(null, uploadStorageService.buildFilename(file.originalname, file.mimetype));
          } catch {
            cb(new BadRequestException("Dosya adi olusturulamadi."), "");
          }
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          cb(new BadRequestException("Sadece gorsel dosyalari yuklenebilir."), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file?.filename) throw new BadRequestException("Dosya gerekli.");
    return { url: this.uploads.publicUrl(file.filename) };
  }
}
