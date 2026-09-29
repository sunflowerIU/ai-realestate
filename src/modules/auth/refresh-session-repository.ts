import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";

@Injectable()
export class RefreshSessionRepository {
  constructor(private readonly db: DatabaseService) {}

  //
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.db.refreshSession.create({ data });
  }

  //
  findByTokenHash(tokenHash: string) {
    return this.db.refreshSession.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  //
  rotate({
    currentTokenHash,
    expiresAt,
    id,
    newTokenHash,
  }: {
    id: string;
    currentTokenHash: string;
    newTokenHash: string;
    expiresAt: Date;
  }) {
    return this.db.refreshSession.updateMany({
      where: {
        id,
        tokenHash: currentTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: { tokenHash: newTokenHash, expiresAt },
    });
  }

  //
  revoke(id: string) {
    return this.db.refreshSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  //
  findById(id: string) {
    return this.db.refreshSession.findUnique({
      where: {
        id,
      },
    });
  }
}
