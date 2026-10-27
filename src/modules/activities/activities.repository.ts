import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListActivitiesInput } from "./activities.schema.js";

@Injectable()
export class ActivitiesRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.ActivityUncheckedCreateInput) {
    return this.db.activity.create({ data });
  }

  findOne(agentId: string, id: string) {
    return this.db.activity.findFirst({ where: { id, agentId } });
  }

  update(agentId: string, id: string, data: Prisma.ActivityUpdateManyMutationInput) {
    return this.db.activity.updateMany({ where: { id, agentId }, data });
  }

  delete(agentId: string, id: string) {
    return this.db.activity.deleteMany({ where: { id, agentId } });
  }

  list(agentId: string, input: ListActivitiesInput, skip: number, take: number) {
    const where: Prisma.ActivityWhereInput = {
      agentId,
      ...(input.type ? { type: input.type } : {}),
      ...(input.clientId ? { clientId: input.clientId } : {}),
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      ...(input.requirementId ? { requirementId: input.requirementId } : {}),
      ...(input.from || input.to ? { occurredAt: {
        ...(input.from ? { gte: new Date(input.from) } : {}),
        ...(input.to ? { lte: new Date(input.to) } : {}),
      } } : {}),
      ...(input.followUpsOnly === "true" ? { followUpAt: { not: null } } : {}),
    };
    return Promise.all([
      this.db.activity.findMany({ where, orderBy: [{ occurredAt: input.sort === "oldest" ? "asc" : "desc" }, { id: "asc" }], skip, take }),
      this.db.activity.count({ where }),
    ]);
  }
}
