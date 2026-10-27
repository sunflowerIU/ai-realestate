import { Injectable } from "@nestjs/common";
import { AppError, NotFoundError } from "../../common/errors/app-error.js";
import { toNpr } from "../../common/nepal/units.js";
import { paginate } from "../../common/pagination/pagination.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { Prisma, type Deal } from "../../database/prisma-client.js";
import { ClientsService } from "../clients/clients.service.js";
import { PropertiesService } from "../properties/properties.service.js";
import { RequirementsService } from "../requirements/requirements.service.js";
import { DealsRepository } from "./deals.repository.js";
import type { CreateDealInput, ListDealsInput, UpdateDealInput } from "./deals.schema.js";

function present(deal: Deal) {
  return {
    ...deal,
    agreedPriceNpr: deal.agreedPriceNpr?.toString() ?? null,
    commissionNpr: deal.commissionNpr?.toString() ?? null,
  };
}

function money(value: string | null | undefined) {
  return value == null ? null : toNpr(value, "NPR");
}

function closedAt(status: string): Date | null {
  return status === "WON" || status === "LOST" || status === "CANCELLED" ? new Date() : null;
}

@Injectable()
export class DealsService {
  constructor(
    private readonly deals: DealsRepository,
    private readonly clients: ClientsService,
    private readonly properties: PropertiesService,
    private readonly requirements: RequirementsService,
  ) {}

  private async checkLinks(agentId: string, clientId: string, propertyId: string, requirementId: string | null) {
    await Promise.all([this.clients.get(agentId, clientId), this.properties.get(agentId, propertyId)]);
    if (requirementId) {
      const requirement = await this.requirements.get(agentId, requirementId);
      if (requirement.clientId !== clientId) {
        throw new AppError("VALIDATION_ERROR", "Requirement belongs to a different client", 400);
      }
    }
  }

  async create(agentId: string, input: CreateDealInput) {
    await this.checkLinks(agentId, input.clientId, input.propertyId, input.requirementId ?? null);
    try {
      const status = input.status ?? "OPEN";
      const deal = await this.deals.create({
        agentId,
        clientId: input.clientId,
        propertyId: input.propertyId,
        requirementId: input.requirementId ?? null,
        status,
        agreedPriceNpr: money(input.agreedPriceNpr),
        commissionNpr: money(input.commissionNpr),
        notes: input.notes ?? null,
        closedAt: closedAt(status),
      });
      return present(deal);
    } catch (error) {
      this.rethrow(error);
    }
  }

  async get(agentId: string, id: string) {
    const deal = await this.deals.findOne(agentId, id);
    if (!deal) throw new NotFoundError("Deal not found");
    return present(deal);
  }

  async list(agentId: string, input: ListDealsInput) {
    const { skip, take, page, pageSize } = toPagination(input);
    const [deals, total] = await this.deals.list(agentId, input, skip, take);
    return paginate(deals.map(present), page, pageSize, total);
  }

  async update(agentId: string, id: string, input: UpdateDealInput) {
    const existing = await this.deals.findOne(agentId, id);
    if (!existing) throw new NotFoundError("Deal not found");
    await this.checkLinks(agentId, input.clientId ?? existing.clientId, input.propertyId ?? existing.propertyId, input.requirementId === undefined ? existing.requirementId : input.requirementId);
    try {
      const data: Prisma.DealUpdateManyMutationInput = {
        ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
        ...(input.propertyId !== undefined ? { propertyId: input.propertyId } : {}),
        ...(input.requirementId !== undefined ? { requirementId: input.requirementId } : {}),
        ...(input.status !== undefined ? {
          status: input.status,
          closedAt: input.status === existing.status ? existing.closedAt : closedAt(input.status),
        } : {}),
        ...(input.agreedPriceNpr !== undefined ? { agreedPriceNpr: money(input.agreedPriceNpr) } : {}),
        ...(input.commissionNpr !== undefined ? { commissionNpr: money(input.commissionNpr) } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      };
      const result = await this.deals.update(agentId, id, data);
      if (result.count !== 1) throw new NotFoundError("Deal not found");
      return this.get(agentId, id);
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (error instanceof RangeError) throw new AppError("VALIDATION_ERROR", error.message, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new NotFoundError("Related record not found");
    }
    throw error;
  }
}
