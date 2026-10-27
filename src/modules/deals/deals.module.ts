import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module.js";
import { PropertiesModule } from "../properties/properties.module.js";
import { RequirementsModule } from "../requirements/requirements.module.js";
import { DealsController } from "./deals.controller.js";
import { DealsRepository } from "./deals.repository.js";
import { DealsService } from "./deals.service.js";

@Module({
  imports: [ClientsModule, PropertiesModule, RequirementsModule],
  controllers: [DealsController],
  providers: [DealsRepository, DealsService],
})
export class DealsModule {}
