import { Injectable } from "@nestjs/common";
import type { AiOperation } from "../../generated/prisma/enums.js";
import { MODEL_REGISTRY, type ModelRoute } from "./model-registry.js";

@Injectable()
export class ModelRouterService {
  //
  getRoute(operation: AiOperation): ModelRoute {
    const route = MODEL_REGISTRY[operation];

    if (!route) {
      throw new Error(
        `No model route configured for AI operation: ${operation}`,
      );
    }

    return route;
  }
}
