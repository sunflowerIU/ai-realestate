import { Module } from "@nestjs/common";
import { StorageModule } from "../../storage/storage.module.js";
import { ExcelImportController } from "./excel-import.controller.js";
import { ExcelImportService } from "./excel-import.service.js";

@Module({
  imports: [StorageModule],

  controllers: [ExcelImportController],

  providers: [ExcelImportService],
})
export class ImportsModule {}
