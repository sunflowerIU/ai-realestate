import { Module } from "@nestjs/common";
import { ClientsModule } from "../clients/clients.module.js";
import { PropertiesController } from "./properties.controller.js";
import { PropertiesRepository } from "./properties.repository.js";
import { PropertiesService } from "./properties.service.js";

@Module({
  imports: [ClientsModule],
  controllers: [PropertiesController],
  providers: [PropertiesRepository, PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
