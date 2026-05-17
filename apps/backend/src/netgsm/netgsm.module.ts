import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { NetgsmAdminController } from "./netgsm-admin.controller";
import { NetgsmService } from "./netgsm.service";

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [NetgsmAdminController],
  providers: [NetgsmService],
  exports: [NetgsmService],
})
export class NetgsmModule {}