import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { UsersModule } from "../../users/users.module.js";
import { AdminAgentController } from "./admin-agents.controller.js";
import { AdminAgentService } from "./admin-agents.service.js";
import { CreditsModule } from "../../credits/credits.module.js";

@Module({
  imports: [AuthModule, UsersModule, CreditsModule],
  controllers: [AdminAgentController],
  providers: [AdminAgentService],
})
export class AdminAgentsModule {}
