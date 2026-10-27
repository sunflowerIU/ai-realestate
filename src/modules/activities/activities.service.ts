import { Injectable } from "@nestjs/common";
import { AppError, NotFoundError } from "../../common/errors/app-error.js";
import { paginate } from "../../common/pagination/pagination.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { Prisma } from "../../database/prisma-client.js";
import { ClientsService } from "../clients/clients.service.js";
import { PropertiesService } from "../properties/properties.service.js";
import { RequirementsService } from "../requirements/requirements.service.js";
import { ActivitiesRepository } from "./activities.repository.js";
import type { CreateActivityInput, ListActivitiesInput, UpdateActivityInput } from "./activities.schema.js";

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly activities: ActivitiesRepository,
    private readonly clients: ClientsService,
    private readonly properties: PropertiesService,
    private readonly requirements: RequirementsService,
  ) {}

  private async checkLinks(agentId: string, input: { clientId?: string | null | undefined; propertyId?: string | null | undefined; requirementId?: string | null | undefined }) {
    if (input.clientId) await this.clients.get(agentId, input.clientId);
    if (input.propertyId) await this.properties.get(agentId, input.propertyId);
    if (input.requirementId) {
      const requirement = await this.requirements.get(agentId, input.requirementId);
      if (input.clientId && requirement.clientId !== input.clientId) {
        throw new AppError("VALIDATION_ERROR", "Requirement belongs to a different client", 400);
      }
    }
  }

  async create(agentId: string, input: CreateActivityInput) {
    await this.checkLinks(agentId, input);
    try {
      return await this.activities.create({
        agentId,
        type: input.type,
        notes: input.notes,
        occurredAt: new Date(input.occurredAt),
        followUpAt: input.followUpAt ? new Date(input.followUpAt) : null,
        clientId: input.clientId ?? null,
        propertyId: input.propertyId ?? null,
        requirementId: input.requirementId ?? null,
      });
    } catch (error) {
      this.rethrow(error);
    }
  }

  async get(agentId: string, id: string) {
    const row = await this.activities.findOne(agentId, id);
    if (!row) throw new NotFoundError("Activity not found");
    return row;
  }

  async list(agentId: string, input: ListActivitiesInput) {
    const { skip, take, page, pageSize } = toPagination(input);
    const [items, total] = await this.activities.list(agentId, input, skip, take);
    return paginate(items, page, pageSize, total);
  }

  async update(agentId: string, id: string, input: UpdateActivityInput) {
    const existing = await this.activities.findOne(agentId, id);
    if (!existing) throw new NotFoundError("Activity not found");
    await this.checkLinks(agentId, {
      clientId: input.clientId === undefined ? existing.clientId : input.clientId,
      propertyId: input.propertyId === undefined ? existing.propertyId : input.propertyId,
      requirementId: input.requirementId === undefined ? existing.requirementId : input.requirementId,
    });
    const data: Prisma.ActivityUpdateManyMutationInput = {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.occurredAt !== undefined ? { occurredAt: new Date(input.occurredAt) } : {}),
      ...(input.followUpAt !== undefined ? { followUpAt: input.followUpAt ? new Date(input.followUpAt) : null } : {}),
      ...(input.clientId !== undefined ? { clientId: input.clientId } : {}),
      ...(input.propertyId !== undefined ? { propertyId: input.propertyId } : {}),
      ...(input.requirementId !== undefined ? { requirementId: input.requirementId } : {}),
    };
    try {
      const result = await this.activities.update(agentId, id, data);
      if (result.count !== 1) throw new NotFoundError("Activity not found");
      return this.get(agentId, id);
    } catch (error) {
      this.rethrow(error);
    }
  }

  async delete(agentId: string, id: string): Promise<void> {
    const result = await this.activities.delete(agentId, id);
    if (result.count !== 1) throw new NotFoundError("Activity not found");
  }

  private rethrow(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new NotFoundError("Related record not found");
    }
    throw error;
  }
}
