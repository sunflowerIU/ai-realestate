import { Injectable, Logger } from "@nestjs/common";
import type { ModelRouterService } from "./model-router.service.js";
import type { AiProviderRegistry } from "./providers/ai-provider.registry.js";

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);

  constructor(
    private readonly router: ModelRouterService,
    private readonly providers: AiProviderRegistry,
  ) {}
}
