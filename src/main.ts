import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module.js";
import { configureHttp } from "./bootstrap.js";
import type { Environment } from "./config/environment.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Environment, true>);
  configureHttp(app, config.get("NODE_ENV", { infer: true }));

  await app.listen(config.get("PORT", { infer: true }));
}

void bootstrap();
