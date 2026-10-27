import { Injectable } from "@nestjs/common";
import { AppError, NotFoundError } from "../../common/errors/app-error.js";
import { paginate } from "../../common/pagination/pagination.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { Prisma } from "../../database/prisma-client.js";
import { ClientsService } from "../clients/clients.service.js";
import { PropertiesService } from "../properties/properties.service.js";
import { RequirementsService } from "../requirements/requirements.service.js";
import { VisitsRepository } from "./visits.repository.js";
import type { CreateVisitInput, ListVisitsInput, UpdateVisitInput } from "./visits.schema.js";

@Injectable()
export class VisitsService {
  constructor(
    private readonly visits: VisitsRepository,
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

  async create(agentId: string, input: CreateVisitInput) {
    await this.checkLinks(agentId, input.clientId, input.propertyId, input.requirementId ?? null);
    try {
      return await this.visits.create({
        agentId,
        clientId: input.clientId,
        propertyId: input.propertyId,
        requirementId: input.requirementId ?? null,
        visitedAt: new Date(input.visitedAt),
        status: input.status ?? "PLANNED",
        feedback: input.feedback ?? null,
        notes: input.notes ?? null,
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async get(agentId: string, id: string) {
    const visit = await this.visits.findOne(agentId, id);
    if (!visit) throw new NotFoundError("Visit not found");
    return visit;
  }

  async list(agentId: string, input: ListVisitsInput) {
    const { skip, take, page, pageSize } = toPagination(input);
    const [items, total] = await this.visits.list(agentId, input, skip, take);
    return paginate(items, page, pageSize, total);
  }

  async update(agentId: string, id: string, input: UpdateVisitInput) {
    const existing = await this.visits.findOne(agentId, id);
    if (!existing) throw new NotFoundError("Visit not found");
    await this.checkLinks(agentId, input.clientId ?? existing.clientId, input.propertyId ?? existing.propertyId, input.requirementId === undefined ? existing.requirementId : input.requirementId);
    const data: Prisma.VisitUpdateManyMutationInput = {
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.propertyId !== undefined ? { propertyId: input.propertyId } : {}),
      ...(input.requirementId !== undefined ? { requirementId: input.requirementId } : {}),
      ...(input.visitedAt !== undefined ? { visitedAt: new Date(input.visitedAt) } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    };
    try {
      const result = await this.visits.update(agentId, id, data);
      if (result.count !== 1) throw new NotFoundError("Visit not found");
      return this.get(agentId, id);
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new NotFoundError("Related record not found");
    }
    throw error;
  }
}
