import { Injectable } from "@nestjs/common";
import { normalizeLocation } from "../../common/nepal/locations.js";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListRequirementsInput } from "./requirements.schema.js";

@Injectable()
export class RequirementsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.BuyerRequirementUncheckedCreateInput) {
    return this.db.buyerRequirement.create({ data });
  }

  findOne(agentId: string, id: string) {
    return this.db.buyerRequirement.findFirst({ where: { agentId, id } });
  }

  update(agentId: string, id: string, data: Prisma.BuyerRequirementUpdateManyMutationInput) {
    return this.db.buyerRequirement.updateMany({ where: { agentId, id }, data });
  }

  list(agentId: string, input: ListRequirementsInput, skip: number, take: number) {
    const conditions: Prisma.BuyerRequirementWhereInput[] = [];
    if (input.search) conditions.push({ OR: [
      { title: { contains: input.search, mode: "insensitive" } },
      { notes: { contains: input.search, mode: "insensitive" } },
    ] });
    if (input.budgetAtLeastNpr) conditions.push({ OR: [
      { maxBudgetNpr: null },
      { maxBudgetNpr: { gte: BigInt(input.budgetAtLeastNpr) } },
    ] });
    if (input.budgetAtMostNpr) conditions.push({ OR: [
      { minBudgetNpr: null },
      { minBudgetNpr: { lte: BigInt(input.budgetAtMostNpr) } },
    ] });
    const where: Prisma.BuyerRequirementWhereInput = {
      agentId,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.propertyType ? { propertyType: input.propertyType } : {}),
      ...(input.transactionType ? { transactionType: input.transactionType } : {}),
      ...(input.location ? { preferredLocations: { has: normalizeLocation(input.location) } } : {}),
      ...(conditions.length ? { AND: conditions } : {}),
    };
    return Promise.all([
      this.db.buyerRequirement.findMany({
        where,
        orderBy: [{ createdAt: input.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }],
        skip,
        take,
      }),
      this.db.buyerRequirement.count({ where }),
    ]);
  }
}
