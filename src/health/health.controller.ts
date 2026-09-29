import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  Version,
} from "@nestjs/common";
import { DatabaseService } from "../database/database.service.js";
import { Public } from "../modules/auth/decorators/public.decorator.js";

@Public()
@Controller("health")
export class HealthController {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  @Get("live")
  @Version("1")
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  @Version("1")
  async ready(): Promise<{ status: "ready"; checks: { database: "up" } }> {
    try {
      await this.database.ping();
      return { status: "ready", checks: { database: "up" } };
    } catch {
      throw new ServiceUnavailableException("Database is unavailable");
    }
  }
}
