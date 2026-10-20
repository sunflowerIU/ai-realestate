import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { UsersModule } from "../users/users.module.js";
import { PasswordService } from "./password.service.js";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshSessionRepository } from "./refresh-session-repository.js";
import { RefreshTokenService } from "./refresh-token.service.js";
import { AuthGuard } from "./guards/auth.guard.js";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>("JWT_ACCESS_SECRET"),
        signOptions: {
          algorithm: "HS256",
        },
        verifyOptions: {
          algorithms: ["HS256"],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    RefreshSessionRepository,
    RefreshTokenService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService, JwtModule, PasswordService, RefreshSessionRepository],
})
export class AuthModule {}
