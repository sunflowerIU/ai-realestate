import { Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import { AppError } from "../errors/app-error.js";

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Request validation failed",
        400,
        result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      );
    }
    return result.data;
  }
}
