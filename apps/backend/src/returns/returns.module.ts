import { Module } from "@nestjs/common";
import { EmailModule } from "../email/email.module";
import { PaymentsModule } from "../payments/payments.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ReturnsController } from "./returns.controller";
import { ReturnsService } from "./returns.service";

@Module({
  imports: [PrismaModule, EmailModule, PaymentsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
