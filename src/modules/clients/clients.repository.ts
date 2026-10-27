import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { CreateClientInput, UpdateClientInput, ListClientsInput } from "./clients.schema.js";

@Injectable()
export class ClientsRepository {
  constructor(private readonly db: DatabaseService) {}

  create(agentId: string, input: CreateClientInput) {
    return this.db.client.create({ data: {
      agentId,
      name: input.name,
      phone: input.phone ?? null,
      alternatePhone: input.alternatePhone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
      source: input.source ?? null,
      status: input.status ?? "ACTIVE",
    } });
  }

  findOne(agentId: string, id: string) {
    return this.db.client.findFirst({ where: { id, agentId } });
  }

  list(agentId: string, input: ListClientsInput, skip: number, take: number) {
    const where: Prisma.ClientWhereInput = {
      agentId,
      ...(input.status ? { status: input.status } : {}),
      ...(input.search ? { OR: [
        { name: { contains: input.search, mode: "insensitive" } },
        { phone: { contains: input.search } },
        { alternatePhone: { contains: input.search } },
        { email: { contains: input.search, mode: "insensitive" } },
      ] } : {}),
    };
    const orderBy: Prisma.ClientOrderByWithRelationInput = input.sort === "name_asc"
      ? { name: "asc" }
      : input.sort === "name_desc"
        ? { name: "desc" }
        : { createdAt: input.sort === "oldest" ? "asc" : "desc" };
    return Promise.all([
      this.db.client.findMany({ where, orderBy: [orderBy, { id: "asc" }], skip, take }),
      this.db.client.count({ where }),
    ]);
  }

  update(agentId: string, id: string, input: UpdateClientInput) {
    const data: Prisma.ClientUpdateManyMutationInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.alternatePhone !== undefined ? { alternatePhone: input.alternatePhone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.source !== undefined ? { source: input.source } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    };
    return this.db.client.updateMany({ where: { id, agentId }, data });
  }

  delete(agentId: string, id: string) {
    return this.db.client.deleteMany({ where: { id, agentId } });
  }
}
