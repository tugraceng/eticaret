import { BadRequestException, Body, Controller, Post, ServiceUnavailableException } from "@nestjs/common";
import { EmailService } from "../email/email.service";
import { SettingsService } from "../settings/settings.service";
import { ContactFormDto } from "./dto/contact-form.dto";

@Controller("contact")
export class ContactController {
  constructor(
    private readonly email: EmailService,
    private readonly settings: SettingsService,
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
    const r = await this.email.contactFormMail({
      to,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      message: dto.message.trim(),
    });
    if (!r.ok) {
      throw new ServiceUnavailableException(r.userFacing);
    }
    return { ok: true };
  }
}
