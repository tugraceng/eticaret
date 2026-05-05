import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Beklenmeyen bir hata olustu.";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (typeof body === "object" && body && "message" in body) {
        const m = (body as { message?: unknown }).message;
        if (typeof m === "string" || Array.isArray(m)) {
          message = m as string | string[];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    const errorText = exception instanceof Error ? exception.stack ?? exception.message : String(exception);
    this.logger.error(`${request.method} ${request.url}`, errorText);

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
