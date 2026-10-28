import { Injectable } from "@nestjs/common";
import { AppError, NotFoundError } from "../../common/errors/app-error.js";
import { toNpr, toSquareMillimeters } from "../../common/nepal/units.js";
import { paginate } from "../../common/pagination/pagination.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { Prisma } from "../../database/prisma-client.js";
import { ClientsService } from "../clients/clients.service.js";
import { RequirementsRepository } from "./requirements.repository.js";
import type {
  CreateRequirementInput,
  ListRequirementsInput,
  UpdateRequirementInput,
} from "./requirements.schema.js";

function present(
  row: Prisma.BuyerRequirementGetPayload<{
    include: { preferredLocations: true };
  }>,
) {
  return {
    ...row,
    minBudgetNpr: row.minBudgetNpr?.toString() ?? null,
    maxBudgetNpr: row.maxBudgetNpr?.toString() ?? null,
    minLandAreaSqMm: row.minLandAreaSqMm?.toString() ?? null,
    maxLandAreaSqMm: row.maxLandAreaSqMm?.toString() ?? null,
    minRoadAccessMeters: row.minRoadAccessMeters?.toString() ?? null,
  };
}

function money(value: string | null | undefined) {
  return value == null ? null : toNpr(value, "NPR");
}

function area(value: string | null | undefined) {
  return value == null ? null : toSquareMillimeters(value, "SQ_M");
}

function assertRanges(
  minBudget: bigint | null,
  maxBudget: bigint | null,
  minArea: bigint | null,
  maxArea: bigint | null,
) {
  if (
    (minBudget !== null && maxBudget !== null && minBudget > maxBudget) ||
    (minArea !== null && maxArea !== null && minArea > maxArea)
  ) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Minimum must not exceed maximum",
      400,
    );
  }
}

@Injectable()
export class RequirementsService {
  constructor(
    private readonly requirements: RequirementsRepository,
    private readonly clients: ClientsService,
  ) {}

  async create(agentId: string, input: CreateRequirementInput) {
    if (input.clientId) {
      await this.clients.get(agentId, input.clientId);
    }
    try {
      const minBudgetNpr = money(input.minBudgetNpr);
      const maxBudgetNpr = money(input.maxBudgetNpr);
      const minLandAreaSqMm = area(input.minLandAreaSqM);
      const maxLandAreaSqMm = area(input.maxLandAreaSqM);
      assertRanges(
        minBudgetNpr,
        maxBudgetNpr,
        minLandAreaSqMm,
        maxLandAreaSqMm,
      );
      const row = await this.requirements.create({
        agentId,
        clientId: input.clientId ?? null,
        title: input.title ?? null,
        transactionType: input.transactionType,
        propertyType: input.propertyType,
        preferredLocations: { create: input.preferredLocations },
        minBudgetNpr,
        buyerName: input.buyerName ?? null,
        buyerPhoneNo: input.buyerPhoneNo,
        buyerEmail: input.buyerEmail ?? null,
        maxBudgetNpr,
        minLandAreaSqMm,
        maxLandAreaSqMm,
        minBedrooms: input.minBedrooms ?? null,
        minRoadAccessMeters: input.minRoadAccessMeters ?? null,
        notes: input.notes ?? null,
        status: input.status ?? "ACTIVE",
      });
      return present(row);
    } catch (error) {
      this.rethrow(error);
    }
  }

  async get(agentId: string, id: string) {
    const row = await this.requirements.findOne(agentId, id);
    if (!row) throw new NotFoundError("Requirement not found");
    return present(row);
  }

  async delete(agentId: string, id: string) {
    const row = await this.requirements.delete(agentId, id);
    if (!row) throw new NotFoundError("Requirement not found");
    return row;
  }

  async list(agentId: string, input: ListRequirementsInput) {
    const { skip, take, page, pageSize } = toPagination(input);
    const [rows, total] = await this.requirements.list(
      agentId,
      input,
      skip,
      take,
    );
    return paginate(rows.map(present), page, pageSize, total);
  }

  async update(agentId: string, id: string, input: UpdateRequirementInput) {
    const existing = await this.requirements.findOne(agentId, id);
    if (!existing) throw new NotFoundError("Requirement not found");
    try {
      const minBudgetNpr =
        input.minBudgetNpr !== undefined
          ? money(input.minBudgetNpr)
          : existing.minBudgetNpr;
      const maxBudgetNpr =
        input.maxBudgetNpr !== undefined
          ? money(input.maxBudgetNpr)
          : existing.maxBudgetNpr;
      const minLandAreaSqMm =
        input.minLandAreaSqM !== undefined
          ? area(input.minLandAreaSqM)
          : existing.minLandAreaSqMm;
      const maxLandAreaSqMm =
        input.maxLandAreaSqM !== undefined
          ? area(input.maxLandAreaSqM)
          : existing.maxLandAreaSqMm;
      assertRanges(
        minBudgetNpr,
        maxBudgetNpr,
        minLandAreaSqMm,
        maxLandAreaSqMm,
      );
      const data: Prisma.BuyerRequirementUncheckedUpdateInput = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.transactionType !== undefined
          ? { transactionType: input.transactionType }
          : {}),
        ...(input.propertyType !== undefined
          ? { propertyType: input.propertyType }
          : {}),
        ...(input.preferredLocations !== undefined
          ? {
              preferredLocations: {
                deleteMany: {},
                create: input.preferredLocations,
              },
            }
          : {}),
        ...(input.minBudgetNpr !== undefined ? { minBudgetNpr } : {}),
        ...(input.maxBudgetNpr !== undefined ? { maxBudgetNpr } : {}),
        ...(input.minLandAreaSqM !== undefined ? { minLandAreaSqMm } : {}),
        ...(input.maxLandAreaSqM !== undefined ? { maxLandAreaSqMm } : {}),
        ...(input.minBedrooms !== undefined
          ? { minBedrooms: input.minBedrooms }
          : {}),
        ...(input.minRoadAccessMeters !== undefined
          ? { minRoadAccessMeters: input.minRoadAccessMeters }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      };
      const result = await this.requirements.update(agentId, id, data);
      return present(result);
    } catch (error) {
      this.rethrow(error);
    }
  }

  private rethrow(error: unknown): never {
    if (error instanceof RangeError)
      throw new AppError("VALIDATION_ERROR", error.message, 400);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      throw new NotFoundError("Client not found");
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Requirement not found");
    }
    throw error;
  }
}
