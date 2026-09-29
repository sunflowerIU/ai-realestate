import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { AppError } from "./app-error.js";

type RequestWithId = Request & { id?: string };

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const requestId = request.id ?? String(request.headers["x-request-id"] ?? "unknown");

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message = "Internal server error";
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = status === HttpStatus.SERVICE_UNAVAILABLE ? "SERVICE_UNAVAILABLE" : "HTTP_ERROR";
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object" && "message" in body) {
        const value = body.message;
        message = Array.isArray(value) ? value.join(", ") : String(value);
      } else {
        message = exception.message;
      }
    } else {
      this.logger.error({ err: exception, requestId, path: request.originalUrl }, "Unhandled exception");
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details === undefined ? {} : { details }),
      },
      requestId,
      path: request.originalUrl,
    });
  }
}
