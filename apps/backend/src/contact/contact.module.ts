import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { ContactController } from "./contact.controller";

@Module({
  imports: [SettingsModule],
  controllers: [ContactController],
})
export class ContactModule {}
