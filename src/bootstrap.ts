import { randomUUID } from "node:crypto";
import { RequestMethod, VersioningType, type INestApplication } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

type RequestWithId = Request & { id?: string };

export function configureHttp(app: INestApplication, nodeEnv: string): void {
  app.getHttpAdapter().getInstance().disable("x-powered-by");
  app.use((request: RequestWithId, response: Response, next: NextFunction) => {
    const incoming = request.headers["x-request-id"];
    const requestId = typeof incoming === "string" && incoming.trim() ? incoming : randomUUID();
    request.id = requestId;
    request.headers["x-request-id"] = requestId;
    response.setHeader("x-request-id", requestId);
    next();
  });

  app.setGlobalPrefix("api", {
    exclude: [{ path: "", method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.enableShutdownHooks();

  if (nodeEnv === "development") {
    app.enableCors({ origin: true, credentials: true });
  }
}
