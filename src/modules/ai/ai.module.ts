import { Module } from "@nestjs/common";
import { CreditsModule } from "../credits/credits.module.js";
import { GroqProvider } from "./providers/groq.provider.js";
import { GeminiProvider } from "./providers/gemini.provider.js";
import { AiProviderRegistry } from "./providers/ai-provider.registry.js";
import { ModelRouterService } from "./model-router.service.js";
import { AiPricingService } from "./ai-pricing.service.js";
import { AiUsageService } from "./ai-usage.service.js";
import { AiGatewayService } from "./ai-gateway.service.js";

@Module({
  imports: [CreditsModule],
  providers: [
    GroqProvider,
    GeminiProvider,
    AiProviderRegistry,
    ModelRouterService,
    AiPricingService,
    AiUsageService,
    AiGatewayService,
  ],
  exports: [AiGatewayService],
})
export class AiModule {}
