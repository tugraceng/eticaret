import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { EmailService } from "./email.service";
import { SmtpAdminController } from "./smtp-admin.controller";

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [SmtpAdminController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
