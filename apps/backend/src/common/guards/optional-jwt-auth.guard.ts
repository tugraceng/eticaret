import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Bearer yoksa geçer; varsa JWT doğrulanır (misafir checkout + üye checkout). */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ headers?: { authorization?: string } }>();
    const auth = req.headers?.authorization;
    if (!auth || typeof auth !== "string" || !auth.startsWith("Bearer ")) {
      return true;
    }
    return (await super.canActivate(context)) as boolean;
  }
}
