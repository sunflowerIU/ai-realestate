import { Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service.js";
import { PasswordService } from "./password.service.js";
import { AppError } from "../../common/errors/app-error.js";
import { ErrorCode } from "../../common/errors/error-code.js";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshTokenService } from "./refresh-token.service.js";
import { RefreshSessionRepository } from "./refresh-session-repository.js";
import type { AccessTokenPayload } from "./types/access-token-payload.js";
import type { LoginInput } from "./schemas/login.schema.js";
import type { StringValue } from "ms";
import type { RefreshInput } from "./schemas/refresh.schema.js";
import type { LogoutInput } from "./schemas/logout.schema.js";
import type { USER_ROLE } from "../users/types/user.types.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly sessions: RefreshSessionRepository,
  ) {}

  //
  async login(input: LoginInput) {
    const email = input.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw this.invalidCredentials();
    }

    if (user.status !== "ACTIVE") {
      throw this.invalidCredentials();
    }

    const passwordMatches = await this.passwordService.verify(
      user.passwordHash,
      input.password,
    );

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const tokens = await this.createSession(user.id, user.role);

    return { user: this.tosafeUser(user), ...tokens };
  }

  //
  async logout(input: LogoutInput): Promise<void> {
    const tokenHash = this.refreshTokens.hash(input.refreshToken);

    const session = await this.sessions.findByTokenHash(tokenHash);

    if (!session) {
      return;
    }

    if (session.revokedAt) {
      return;
    }

    await this.sessions.revoke(session.id);
  }

  //
  async getCurrentUser(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user || user.status !== "ACTIVE") {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Unauthorized", 401);
    }
    return this.tosafeUser(user);
  }

  //
  private invalidCredentials() {
    return new AppError(
      ErrorCode.UNAUTHORIZED,
      "Invalid email or password",
      401,
    );
  }

  ///
  private tosafeUser(user: {
    id: string;
    name: string;
    status: string;
    createdAt: Date;
    email: string;
    role: string;
  }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      role: user.role,
    };
  }

  /////////////tokens/////////////////////
  private async createAccessToken(
    userId: string,
    sessionId: string,
    role: USER_ROLE,
  ): Promise<string> {
    const payload: AccessTokenPayload = { sub: userId, sessionId, role };

    const expiresIn = this.config.getOrThrow<StringValue>("JWT_ACCESS_TTL");

    return this.jwtService.signAsync(payload, { expiresIn });
  }

  ////////sessions///////
  private async createSession(userId: string, role: USER_ROLE) {
    const refreshToken = this.refreshTokens.generate();

    const tokenHash = this.refreshTokens.hash(refreshToken);

    const ttlDays = this.config.getOrThrow<number>("REFRESH_TOKEN_TTL_DAYS");

    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const session = await this.sessions.create({
      userId,
      tokenHash,
      expiresAt,
    });

    const accessToken = await this.createAccessToken(userId, session.id, role);

    return {
      accessToken,
      refreshToken,
    };
  }

  //
  async refresh(input: RefreshInput) {
    const tokenHash = this.refreshTokens.hash(input.refreshToken);

    const session = await this.sessions.findByTokenHash(tokenHash);

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== "ACTIVE"
    ) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid refresh token", 401);
    }

    const newRefreshToken = this.refreshTokens.generate();

    const newTokenHash = this.refreshTokens.hash(newRefreshToken);

    const ttlDays = this.config.getOrThrow<number>("REFRESH_TOKEN_TTL_DAYS");

    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    const rotated = await this.sessions.rotate({
      id: session.id,
      currentTokenHash: tokenHash,
      newTokenHash: newTokenHash,
      expiresAt,
    });
    if (rotated.count !== 1) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid refresh token", 401);
    }

    const accessToken = await this.createAccessToken(
      session.userId,
      session.id,
      session.user.role,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
