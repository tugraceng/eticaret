import { Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

type ReqUser = Request & { user: { sub: string } };

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: ReqUser) {
    return this.notifications.listForUser(req.user.sub);
  }

  @Patch(":id/read")
  markRead(@Req() req: ReqUser, @Param("id") id: string) {
    return this.notifications.markRead(req.user.sub, id);
  }

  @Post("read-all")
  markAllRead(@Req() req: ReqUser) {
    return this.notifications.markAllRead(req.user.sub);
  }
}
