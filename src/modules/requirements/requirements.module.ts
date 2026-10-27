import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module.js";
import { RequirementsController } from "./requirements.controller.js";
import { RequirementsRepository } from "./requirements.repository.js";
import { RequirementsService } from "./requirements.service.js";

@Module({
  imports: [ClientsModule],
  controllers: [RequirementsController],
  providers: [RequirementsRepository, RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}
