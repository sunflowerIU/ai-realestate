import { randomUUID } from "node:crypto";
import type { Params } from "nestjs-pino";

export function createLoggerConfig(nodeEnv: string): Params {
  return {
    pinoHttp: {
      level: nodeEnv === "production" ? "info" : "debug",
      ...(nodeEnv === "development"
        ? { transport: { target: "pino-pretty", options: { colorize: true, singleLine: true } } }
        : {}),
      genReqId(request, response) {
        const incoming = request.headers["x-request-id"];
        const requestId = typeof incoming === "string" && incoming.trim() ? incoming : randomUUID();
        response.setHeader("x-request-id", requestId);
        return requestId;
      },
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']"],
        censor: "[REDACTED]",
      },
      serializers: {
        req(request) {
          return { id: request.id, method: request.method, url: request.url };
        },
      },
    },
  };
}
