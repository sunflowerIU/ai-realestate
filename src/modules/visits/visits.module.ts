import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module.js";
import { PropertiesModule } from "../properties/properties.module.js";
import { RequirementsModule } from "../requirements/requirements.module.js";
import { VisitsController } from "./visits.controller.js";
import { VisitsRepository } from "./visits.repository.js";
import { VisitsService } from "./visits.service.js";

@Module({
  imports: [ClientsModule, PropertiesModule, RequirementsModule],
  controllers: [VisitsController],
  providers: [VisitsRepository, VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
