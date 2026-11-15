// ai-pricing.service.ts

import { Injectable } from "@nestjs/common";

import type { AiOperation } from "../../generated/prisma/enums.js";

@Injectable()
export class AiPricingService {
  reservationFor(operation: AiOperation): bigint {
    switch (operation) {
      case "EXCEL_SCHEMA_MAPPING":
        return 5n;

      case "EXCEL_AMBIGUITY_RESOLUTION":
        return 10n;

      default:
        return 10n;
    }
  }

  chargeFor(
    operation: AiOperation,
    _usage: {
      inputTokens?: number;
      outputTokens?: number;
    },
  ): bigint {
    switch (operation) {
      case "EXCEL_SCHEMA_MAPPING":
        return 1n;

      case "EXCEL_AMBIGUITY_RESOLUTION":
        return 2n;

      default:
        return 1n;
    }
  }
}
