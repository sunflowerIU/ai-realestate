import { Injectable } from "@nestjs/common";
import { ConflictError, NotFoundError } from "../../common/errors/app-error.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { paginate } from "../../common/pagination/pagination.js";
import { ClientsRepository } from "./clients.repository.js";
import { Prisma } from "../../database/prisma-client.js";
import type { CreateClientInput, UpdateClientInput, ListClientsInput } from "./clients.schema.js";

@Injectable()
export class ClientsService {
  constructor(private readonly clients: ClientsRepository) {}

  create(agentId: string, input: CreateClientInput) {
    return this.clients.create(agentId, input);
  }

  async get(agentId: string, id: string) {
    const client = await this.clients.findOne(agentId, id);
    if (!client) throw new NotFoundError("Client not found");
    return client;
  }

  async list(agentId: string, input: ListClientsInput) {
    const { skip, take, page, pageSize } = toPagination(input);
    const [items, total] = await this.clients.list(agentId, input, skip, take);
    return paginate(items, page, pageSize, total);
  }

  async update(agentId: string, id: string, input: UpdateClientInput) {
    const result = await this.clients.update(agentId, id, input);
    if (result.count !== 1) throw new NotFoundError("Client not found");
    return this.get(agentId, id);
  }

  async delete(agentId: string, id: string): Promise<void> {
    try {
      const result = await this.clients.delete(agentId, id);
      if (result.count !== 1) throw new NotFoundError("Client not found");
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictError("Client has linked records");
      }
      throw error;
    }
  }
}
