import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module.js";
import { UsersModule } from "../../users/users.module.js";
import { AdminAgentController } from "./admin-agents.controller.js";
import { AdminAgentService } from "./admin-agents.service.js";

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminAgentController],
  providers: [AdminAgentService],
})
export class AdminAgentsModule {}
