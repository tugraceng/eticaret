import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { SettingsModule } from "../settings/settings.module";
import { ContactController } from "./contact.controller";

@Module({
  imports: [SettingsModule, PrismaModule],
  controllers: [ContactController],
})
export class ContactModule {}
