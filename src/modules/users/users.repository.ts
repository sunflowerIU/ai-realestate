import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service.js";

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.db.user.findUnique({
      where: {
        id,
      },
    });
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.db.user.create({
      data,
    });
  }
}
