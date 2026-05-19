import { BadRequestException, Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { EmailService } from "./email.service";
import { TestSmtpDto } from "./dto/test-smtp.dto";

@Controller("admin/smtp")
@UseGuards(JwtAuthGuard, AdminGuard)
export class SmtpAdminController {
  constructor(private readonly email: EmailService) {}

  @Post("test")
  async test(@Body() dto: TestSmtpDto) {
    await this.email.reloadFromSettings();
    const r = await this.email.sendTestMail(dto.to.trim());
    if (!r.ok) {
      throw new BadRequestException(
        "Test e-postası gönderilemedi. Sunucu, port, kullanıcı adı ve şifreyi kontrol edin.",
      );
    }
    return { ok: true };
  }
}
