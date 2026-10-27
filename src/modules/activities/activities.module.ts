import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module.js";
import { PropertiesModule } from "../properties/properties.module.js";
import { RequirementsModule } from "../requirements/requirements.module.js";
import { ActivitiesController } from "./activities.controller.js";
import { ActivitiesRepository } from "./activities.repository.js";
import { ActivitiesService } from "./activities.service.js";

@Module({
  imports: [ClientsModule, PropertiesModule, RequirementsModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesRepository, ActivitiesService],
})
export class ActivitiesModule {}
