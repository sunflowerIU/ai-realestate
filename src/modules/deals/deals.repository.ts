import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListDealsInput } from "./deals.schema.js";

@Injectable()
export class DealsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.DealUncheckedCreateInput) {
    return this.db.deal.create({ data });
  }

  findOne(agentId: string, id: string) {
    return this.db.deal.findFirst({ where: { id, agentId } });
  }

  update(agentId: string, id: string, data: Prisma.DealUpdateManyMutationInput) {
    return this.db.deal.updateMany({ where: { id, agentId }, data });
  }

  list(agentId: string, input: ListDealsInput, skip: number, take: number) {
    const where: Prisma.DealWhereInput = {
      agentId,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.requirementId ? { requirementId: input.requirementId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.from || input.to ? { createdAt: {
        ...(input.from ? { gte: new Date(input.from) } : {}),
        ...(input.to ? { lte: new Date(input.to) } : {}),
      } } : {}),
    };
    return Promise.all([
      this.db.deal.findMany({ where, orderBy: [{ createdAt: input.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], skip, take }),
      this.db.deal.count({ where }),
    ]);
  }
}
