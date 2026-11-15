import { Body, Controller, Param, Post } from "@nestjs/common";

import { CurrentUser } from "../../auth/decorators/current-user.decorator.js";

import { Roles } from "../../auth/decorators/roles.decorator.js";

import type { AuthenticatedUser } from "../../auth/types/authenticated-user.js";

import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe.js";

import { ExcelImportService } from "./excel-import.service.js";

import {
  createExcelUploadSchema,
  type CreateExcelUploadInput,
} from "./schemas/create-excel-upload.schema.js";

@Controller("imports/excel")
@Roles("AGENT")
export class ExcelImportController {
  constructor(private readonly excelImports: ExcelImportService) {}

  @Post("uploads")
  createUpload(
    @CurrentUser()
    auth: AuthenticatedUser,

    @Body(new ZodValidationPipe(createExcelUploadSchema))
    input: CreateExcelUploadInput,
  ) {
    return this.excelImports.createUpload(auth.userId, input);
  }

  @Post(":id/confirm")
  confirmUpload(
    @CurrentUser()
    auth: AuthenticatedUser,

    @Param("id")
    id: string,
  ) {
    return this.excelImports.confirmUpload(auth.userId, id);
  }
}
