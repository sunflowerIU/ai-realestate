import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListRequirementsInput } from "./requirements.schema.js";

@Injectable()
export class RequirementsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.BuyerRequirementUncheckedCreateInput) {
    return this.db.buyerRequirement.create({
      data,
      include: { preferredLocations: true },
    });
  }
  delete(agentId: string, id: string) {
    return this.db.buyerRequirement.deleteMany({ where: { agentId, id } });
  }

  findOne(agentId: string, id: string) {
    return this.db.buyerRequirement.findFirst({
      where: { agentId, id },
      include: { preferredLocations: true },
    });
  }

  update(
    agentId: string,
    id: string,
    data: Prisma.BuyerRequirementUncheckedUpdateInput,
  ) {
    return this.db.buyerRequirement.update({
      where: { id_agentId: { id, agentId } },
      data,
      include: { preferredLocations: true },
    });
  }

  private async locationWhere(
    agentId: string,
    term: string,
  ): Promise<Prisma.BuyerRequirementWhereInput> {
    const localityRows = await this.db.queryRaw<{ id: string }[]>`
      SELECT DISTINCT location."requirementId" AS id
      FROM "RequirementPreferredLocation" AS location
      JOIN "BuyerRequirement" AS requirement ON requirement.id = location."requirementId"
      CROSS JOIN LATERAL unnest(location.localities) AS locality(value)
      WHERE requirement."agentId" = ${agentId}::uuid
        AND strpos(lower(locality.value), lower(${term})) > 0
    `;
    const contains = { contains: term, mode: "insensitive" as const };
    return {
      OR: [
        { preferredLocations: { some: { province: contains } } },
        { preferredLocations: { some: { district: contains } } },
        { preferredLocations: { some: { municipality: contains } } },
        { id: { in: localityRows.map((row) => row.id) } },
      ],
    };
  }

  async list(
    agentId: string,
    input: ListRequirementsInput,
    skip: number,
    take: number,
  ) {
    const conditions: Prisma.BuyerRequirementWhereInput[] = [];
    if (input.search) {
      const contains = { contains: input.search, mode: "insensitive" as const };
      if (input.searchBy === "location") {
        conditions.push(await this.locationWhere(agentId, input.search));
      } else if (input.searchBy === "client") {
        conditions.push({
          OR: [{ buyerName: contains }, { client: { is: { name: contains } } }],
        });
      } else {
        conditions.push({ OR: [{ title: contains }, { notes: contains }] });
      }
    }
    if (input.location)
      conditions.push(await this.locationWhere(agentId, input.location));
    if (input.budgetAtLeastNpr)
      conditions.push({
        OR: [
          { maxBudgetNpr: null },
          { maxBudgetNpr: { gte: BigInt(input.budgetAtLeastNpr) } },
        ],
      });
    if (input.budgetAtMostNpr)
      conditions.push({
        OR: [
          { minBudgetNpr: null },
          { minBudgetNpr: { lte: BigInt(input.budgetAtMostNpr) } },
        ],
      });
    const where: Prisma.BuyerRequirementWhereInput = {
      agentId,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.propertyType ? { propertyType: input.propertyType } : {}),
      ...(input.transactionType
        ? { transactionType: input.transactionType }
        : {}),
      ...(conditions.length ? { AND: conditions } : {}),
    };
    return Promise.all([
      this.db.buyerRequirement.findMany({
        where,
        orderBy: [
          { createdAt: input.sort === "oldest" ? "asc" : "desc" },
          { id: "asc" },
        ],
        skip,
        take,
        include: { preferredLocations: true },
      }),
      this.db.buyerRequirement.count({ where }),
    ]);
  }
}
