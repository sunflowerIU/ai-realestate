import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListVisitsInput } from "./visits.schema.js";

@Injectable()
export class VisitsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.VisitUncheckedCreateInput) {
    return this.db.visit.create({ data });
  }

  findOne(agentId: string, id: string) {
    return this.db.visit.findFirst({ where: { id, agentId } });
  }

  update(agentId: string, id: string, data: Prisma.VisitUpdateManyMutationInput) {
    return this.db.visit.updateMany({ where: { id, agentId }, data });
  }

  list(agentId: string, input: ListVisitsInput, skip: number, take: number) {
    const where: Prisma.VisitWhereInput = {
      agentId,
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.requirementId ? { requirementId: input.requirementId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.from || input.to ? { visitedAt: {
        ...(input.from ? { gte: new Date(input.from) } : {}),
        ...(input.to ? { lte: new Date(input.to) } : {}),
      } } : {}),
    };
    return Promise.all([
      this.db.visit.findMany({ where, orderBy: [{ visitedAt: input.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], skip, take }),
      this.db.visit.count({ where }),
    ]);
  }
}
