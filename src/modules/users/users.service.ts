import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository.js";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  findById(id: string) {
    return this.usersRepository.findById(id);
  }

  create(data: { email: string; name: string; passwordHash: string }) {
    return this.usersRepository.create(data);
  }
}
