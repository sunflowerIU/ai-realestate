import { Injectable } from "@nestjs/common";
import {
  ConflictError,
  NotFoundError,
  AppError,
} from "../../common/errors/app-error.js";
import { toNpr, toSquareMillimeters } from "../../common/nepal/units.js";
import { paginate } from "../../common/pagination/pagination.js";
import { toPagination } from "../../common/pagination/pagination.schema.js";
import { Prisma, type Property } from "../../database/prisma-client.js";
import { ClientsService } from "../clients/clients.service.js";
import { PropertiesRepository } from "./properties.repository.js";
import type {
  CreatePropertyInput,
  ListPropertiesInput,
  UpdatePropertyInput,
} from "./properties.schema.js";

function present(property: Property) {
  return {
    ...property,
    priceNpr: property.priceNpr?.toString() ?? null,
    landAreaSqMm: property.landAreaSqMm?.toString() ?? null,
    builtUpAreaSqMm: property.builtUpAreaSqMm?.toString() ?? null,
    roadAccessMeters: property.roadAccessMeters?.toString() ?? null,
  };
}

function exactMoney(value: string | null | undefined): bigint | null {
  return value === null || value === undefined ? null : toNpr(value, "NPR");
}

@Injectable()
export class PropertiesService {
  constructor(
    private readonly properties: PropertiesRepository,
    private readonly clients: ClientsService,
  ) {}

  private async checkOwner(
    agentId: string,
    ownerClientId: string | null | undefined,
  ) {
    if (ownerClientId) await this.clients.get(agentId, ownerClientId);
  }

  async create(agentId: string, input: CreatePropertyInput) {
    await this.checkOwner(agentId, input.ownerClientId);
    try {
      const property = await this.properties.create({
        agentId,
        title: input.title,
        propertyType: input.propertyType,
        transactionType: input.transactionType,
        status: input.status ?? "DRAFT",
        code: input.code ?? null,
        ownerClientId: input.ownerClientId ?? null,
        province: input.province ?? null,
        district: input.district ?? null,
        municipality: input.municipality ?? null,
        locality: input.locality ?? null,
        priceNpr: exactMoney(input.priceNpr),
        landAreaSqMm: input.landArea
          ? toSquareMillimeters(input.landArea.value, input.landArea.unit)
          : null,
        landAreaValue: input.landArea?.value ?? null,
        landAreaUnit: input.landArea?.unit ?? null,
        builtUpAreaSqMm: input.builtUpAreaSqM
          ? toSquareMillimeters(input.builtUpAreaSqM, "SQ_M")
          : null,
        bedrooms: input.bedrooms ?? null,
        bathrooms: input.bathrooms ?? null,
        roadAccessMeters: input.roadAccessMeters ?? null,
        facing: input.facing ?? null,
        description: input.description ?? null,
        remarks: input.remarks ?? null,
      });
      return present(property);
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  async get(agentId: string, id: string) {
    const property = await this.properties.findOne(agentId, id);
    if (!property) throw new NotFoundError("Property not found");
    return present(property);
  }

  async list(agentId: string, input: ListPropertiesInput) {
    try {
      const { skip, take, page, pageSize } = toPagination(input);
      const [properties, total] = await this.properties.list(
        agentId,
        input,
        skip,
        take,
      );
      return paginate(properties.map(present), page, pageSize, total);
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  listArchived(agentId: string, input: ListPropertiesInput) {
    return this.list(agentId, { ...input, status: "ARCHIVED" });
  }

  async update(agentId: string, id: string, input: UpdatePropertyInput) {
    await this.checkOwner(agentId, input.ownerClientId);
    try {
      const data: Prisma.PropertyUpdateManyMutationInput = {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.propertyType !== undefined
          ? { propertyType: input.propertyType }
          : {}),
        ...(input.transactionType !== undefined
          ? { transactionType: input.transactionType }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.ownerClientId !== undefined
          ? { ownerClientId: input.ownerClientId }
          : {}),
        ...(input.province !== undefined ? { province: input.province } : {}),
        ...(input.district !== undefined ? { district: input.district } : {}),
        ...(input.municipality !== undefined
          ? { municipality: input.municipality }
          : {}),
        ...(input.locality !== undefined ? { locality: input.locality } : {}),
        ...(input.priceNpr !== undefined
          ? { priceNpr: exactMoney(input.priceNpr) }
          : {}),
        ...(input.landArea !== undefined
          ? {
              landAreaSqMm: input.landArea
                ? toSquareMillimeters(input.landArea.value, input.landArea.unit)
                : null,
              landAreaValue: input.landArea?.value ?? null,
              landAreaUnit: input.landArea?.unit ?? null,
            }
          : {}),
        ...(input.builtUpAreaSqM !== undefined
          ? {
              builtUpAreaSqMm: input.builtUpAreaSqM
                ? toSquareMillimeters(input.builtUpAreaSqM, "SQ_M")
                : null,
            }
          : {}),
        ...(input.bedrooms !== undefined ? { bedrooms: input.bedrooms } : {}),
        ...(input.bathrooms !== undefined
          ? { bathrooms: input.bathrooms }
          : {}),
        ...(input.roadAccessMeters !== undefined
          ? { roadAccessMeters: input.roadAccessMeters }
          : {}),
        ...(input.facing !== undefined ? { facing: input.facing } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      };
      const result = await this.properties.update(agentId, id, data);
      if (result.count !== 1) throw new NotFoundError("Property not found");
      return this.get(agentId, id);
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  async archive(agentId: string, id: string) {
    return this.update(agentId, id, { status: "ARCHIVED" });
  }
  async delete(agentId: string, id: string) {
    return this.properties.delete(agentId, id);
  }

  private rethrowPersistenceError(error: unknown): never {
    if (error instanceof RangeError) {
      throw new AppError("VALIDATION_ERROR", error.message, 400);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002")
        throw new ConflictError("Property code already exists");
      if (error.code === "P2003")
        throw new NotFoundError("Property owner not found");
    }
    throw error;
  }
}
