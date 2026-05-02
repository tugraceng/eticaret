import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

type ReqUser = { role?: UserRole };

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: ReqUser }>();
    if (req.user?.role !== "ADMIN") throw new ForbiddenException();
    return true;
  }
}
