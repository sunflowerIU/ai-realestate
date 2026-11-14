import { Module } from "@nestjs/common";
import { CreditService } from "./credit.service.js";
import { creditsController } from "./credits.controller.js";

@Module({
  controllers: [creditsController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditsModule {}
