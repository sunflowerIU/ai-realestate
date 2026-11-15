import { Injectable, Logger } from "@nestjs/common";
import { ModelRouterService } from "./model-router.service.js";
import { AiProviderRegistry } from "./providers/ai-provider.registry.js";
import { CreditService } from "../credits/credit.service.js";
import { AiPricingService } from "./ai-pricing.service.js";
import { AiUsageService } from "./ai-usage.service.js";

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly router: ModelRouterService,
    private readonly providers: AiProviderRegistry,
    private readonly credits: CreditService,
    private readonly pricing: AiPricingService,
    private readonly usage: AiUsageService,
  ) {}
}
