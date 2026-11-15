import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../../database/database.service.js";
import { ObjectStorageService } from "../../storage/object-storage.service.js";
import type { CreateExcelUploadInput } from "./schemas/create-excel-upload.schema.js";
import { randomUUID } from "node:crypto";
import {
  EXCEL_MIME_TYPE,
  MAX_EXCEL_UPLOAD_BYTES,
  TEMP_IMPORT_TTL_HOURS,
  UPLOAD_URL_TTL_SECONDS,
} from "./excel-import.constants.js";
import { AppError } from "../../../common/errors/app-error.js";
import { ErrorCode } from "../../../common/errors/error-code.js";

@Injectable()
export class ExcelImportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: ObjectStorageService,
  ) {}

  //
  async createUpload(agentId: string, input: CreateExcelUploadInput) {
    const importId = randomUUID();

    const objectKey = `temp/excel/${agentId}/${importId}/${randomUUID}.xlsx`;

    const expiresAt = new Date(
      Date.now() + TEMP_IMPORT_TTL_HOURS * 60 * 60 * 1000,
    );

    const job = await this.db.importJob.create({
      data: {
        id: importId,
        agentId,
        type: "EXCEL",
        status: "AWAITING_UPLOAD",
        objectKey,
        originalFileName: input.fileName,
        contentType: EXCEL_MIME_TYPE,
        expiresAt,
      },
    });

    const upload = await this.storage.createPresignedUploadUrl({
      objectKey: job.objectKey,
      contentType: EXCEL_MIME_TYPE,
      expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
    });

    return {
      importJobId: job.id,
      uploadUrl: upload.uploadUrl,
      expiresInSeconds: upload.expiresInSeconds,
      requiredHeaders: {
        "Content-Type": EXCEL_MIME_TYPE,
      },
    };
  }

  //
  async confirmUpload(agentId: string, importJobId: string) {
    const job = await this.db.importJob.findFirst({
      where: {
        id: importJobId,
        agentId,
      },
    });

    if (!job) {
      throw new AppError(ErrorCode.NOT_FOUND, "Import job not found", 404);
    }

    if (job.status === "UPLOADED") {
      return {
        id: job.id,
        status: job.status,
      };
    }

    if (job.status !== "AWAITING_UPLOAD") {
      throw new AppError(
        ErrorCode.CONFLICT,
        "Import is not awaiting upload",
        409,
      );
    }

    let metadata;

    try {
      metadata = await this.storage.getMetadata(job.objectKey);
    } catch (error) {
      throw new AppError(
        ErrorCode.CONFLICT,
        "Uploaded file was not found",
        409,
      );
    }

    const size = metadata.ContentLength;

    if (!size || size <= 0 || size > MAX_EXCEL_UPLOAD_BYTES) {
      await this.storage.deleteObject(job.objectKey);

      await this.db.importJob.update({
        where: {
          id: job.id,
        },
        data: {
          status: "FAILED",
          errorCode: "INVALID_FILE_SIZE",
          errorMessage: "Uploaded Excel file has an invalid size",
        },
      });
      throw new AppError(ErrorCode.BAD_REQUEST, "Invalid Excel file size", 400);
    }
    const updated = await this.db.importJob.update({
      where: {
        id: job.id,
      },
      data: {
        status: "UPLOADED",
        fileSizeBytes: BigInt(size),
        uploadedAt: new Date(),
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      fileSizeBytes: updated.fileSizeBytes?.toString(),
    };
  }

  //
}
