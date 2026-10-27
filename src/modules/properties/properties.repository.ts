import { Injectable } from "@nestjs/common";
import { toSquareMillimeters } from "../../common/nepal/units.js";
import { DatabaseService } from "../../database/database.service.js";
import type { Prisma } from "../../database/prisma-client.js";
import type { ListPropertiesInput } from "./properties.schema.js";

@Injectable()
export class PropertiesRepository {
  constructor(private readonly db: DatabaseService) {}

  create(data: Prisma.PropertyUncheckedCreateInput) {
    return this.db.property.create({ data });
  }
  delete(agentId: string, id: string) {
    return this.db.property.deleteMany({ where: { id, agentId } });
  }

  findOne(agentId: string, id: string) {
    return this.db.property.findFirst({ where: { id, agentId } });
  }

  update(
    agentId: string,
    id: string,
    data: Prisma.PropertyUpdateManyMutationInput,
  ) {
    return this.db.property.updateMany({ where: { id, agentId }, data });
  }

  list(
    agentId: string,
    input: ListPropertiesInput,
    skip: number,
    take: number,
  ) {
    const where: Prisma.PropertyWhereInput = {
      agentId,
      ...(input.propertyType ? { propertyType: input.propertyType } : {}),
      ...(input.transactionType
        ? { transactionType: input.transactionType }
        : {}),
      status: input.status ?? { not: "ARCHIVED" },
      ...(input.ownerClientId ? { ownerClientId: input.ownerClientId } : {}),
      ...(input.minBedrooms !== undefined
        ? { bedrooms: { gte: input.minBedrooms } }
        : {}),
      ...(input.minRoadAccessMeters !== undefined
        ? { roadAccessMeters: { gte: input.minRoadAccessMeters } }
        : {}),
      ...(input.minPriceNpr !== undefined || input.maxPriceNpr !== undefined
        ? {
            priceNpr: {
              ...(input.minPriceNpr !== undefined
                ? { gte: BigInt(input.minPriceNpr) }
                : {}),
              ...(input.maxPriceNpr !== undefined
                ? { lte: BigInt(input.maxPriceNpr) }
                : {}),
            },
          }
        : {}),
      ...(input.minLandAreaSqM !== undefined ||
      input.maxLandAreaSqM !== undefined
        ? {
            landAreaSqMm: {
              ...(input.minLandAreaSqM !== undefined
                ? { gte: toSquareMillimeters(input.minLandAreaSqM, "SQ_M") }
                : {}),
              ...(input.maxLandAreaSqM !== undefined
                ? { lte: toSquareMillimeters(input.maxLandAreaSqM, "SQ_M") }
                : {}),
            },
          }
        : {}),
      ...(input.location
        ? {
            OR: [
              { province: { contains: input.location, mode: "insensitive" } },
              { district: { contains: input.location, mode: "insensitive" } },
              {
                municipality: { contains: input.location, mode: "insensitive" },
              },
              { locality: { contains: input.location, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(input.search
        ? {
            AND: [
              {
                OR: [
                  { code: { contains: input.search, mode: "insensitive" } },
                  { title: { contains: input.search, mode: "insensitive" } },
                  {
                    description: {
                      contains: input.search,
                      mode: "insensitive",
                    },
                  },
                ],
              },
            ],
          }
        : {}),
    };
    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      input.sort === "price_asc"
        ? { priceNpr: "asc" }
        : input.sort === "price_desc"
          ? { priceNpr: "desc" }
          : { createdAt: input.sort === "oldest" ? "asc" : "desc" };
    return Promise.all([
      this.db.property.findMany({
        where,
        orderBy: [orderBy, { id: "asc" }],
        skip,
        take,
      }),
      this.db.property.count({ where }),
    ]);
  }
}
