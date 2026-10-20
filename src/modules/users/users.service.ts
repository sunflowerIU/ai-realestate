import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository.js";
import type { USER_ROLE, USER_STATUS } from "./types/user.types.js";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  create(data: {
    email: string;
    name: string;
    passwordHash: string;
    role: USER_ROLE;
    status: USER_STATUS;
  }) {
    return this.usersRepository.create(data);
  }
}
