import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { ContactFormDto } from "./dto/contact-form.dto";

@Controller("contact")
export class ContactController {
  constructor(
    private readonly email: EmailService,
    private readonly settings: SettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async submit(@Body() dto: ContactFormDto) {
    const s = await this.settings.getSettings();
    const to = s.contactEmail?.trim();
    if (!to) {
      throw new BadRequestException(
        "İletişim formu şu an aktif değil. Lütfen sayfadaki telefon veya e-posta bilgilerini kullanın.",
      );
    }

    const saved = await this.prisma.contactMessage.create({
      data: {
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        message: dto.message.trim(),
      },
    });

    const r = await this.email.contactFormMail({
      to,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      message: dto.message.trim(),
    });

    if (r.ok) {
      await this.prisma.contactMessage.update({
        where: { id: saved.id },
        data: { emailedAt: new Date() },
      });
      return { ok: true };
    }

    // SMTP yoksa veya gönderim başarısızsa mesaj veritabanında saklandı
    return { ok: true, stored: true };
  }
}
