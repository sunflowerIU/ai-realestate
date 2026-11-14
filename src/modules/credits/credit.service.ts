import { Injectable } from "@nestjs/common";
import type { DatabaseService } from "../../database/database.service.js";
import type {
  ReleaseCreditsInput,
  ReservedCreditsInput,
  SettleCreditsInput,
  TopUpCreditsInput,
} from "./types/credit.types.js";
import { AppError } from "../../common/errors/app-error.js";
import { ErrorCode } from "../../common/errors/error-code.js";

@Injectable()
export class CreditService {
  constructor(private readonly db: DatabaseService) {}

  //
  private hasPrismaCode(error: unknown, code: string): boolean {
    if (typeof error !== "object" || error === null || !("code" in error)) {
      return false;
    }

    return (error as { code?: unknown }).code === code;
  }

  //
  async getBalance(agentId: string) {
    const wallet = await this.db.creditWallet.findUnique({
      where: { agentId },
      select: { availableCredits: true, reservedCredits: true },
    });
    if (!wallet) {
      return {
        availableCredits: "0",
        reservedCredits: "0",
      };
    }

    return {
      availableCredits: wallet.availableCredits.toString(),
      reservedCredits: wallet.reservedCredits.toString(),
    };
  }

  //
  async topup(input: TopUpCreditsInput) {
    if (input.credits <= 0n) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "Top-up credits must be greater than zero",
        400,
      );
    }

    return this.db.transaction(async (tx) => {
      ///1. find agent
      const agent = await tx.user.findFirst({
        where: {
          id: input.agentId,
          role: "AGENT",
        },
        select: {
          id: true,
        },
      });

      if (!agent) {
        throw new AppError(ErrorCode.NOT_FOUND, "Agent not found", 404);
      }

      //update their wallet
      const wallet = await tx.creditWallet.upsert({
        where: {
          agentId: input.agentId,
        },
        create: {
          agentId: input.agentId,
          availableCredits: input.credits,
        },
        update: {
          availableCredits: {
            increment: input.credits,
          },
        },
      });

      //create ledger
      await tx.creditLedger.create({
        data: {
          walletId: wallet.id,
          type: "TOP_UP",
          amount: input.credits,
          referenceId: input.referenceId ?? null,
          description: input.description ?? null,
        },
      });

      //return data
      return {
        availableCredits: wallet.availableCredits.toString(),
        reservedCredits: wallet.reservedCredits.toString(),
      };
    });
  }

  //
  async reserve(input: ReservedCreditsInput) {
    if (input.credits <= 0n) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "Reservation credits must be greater than zero",
        400,
      );
    }

    try {
      return await this.db.transaction(async (tx) => {
        //1. find if there is existing credit reservation
        const existing = await tx.creditReservation.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          include: {
            wallet: true,
          },
        });

        if (existing) {
          if (
            existing.wallet.agentId !== input.agentId ||
            existing.operation !== input.operation ||
            existing.reservedCredits !== input.credits
          ) {
            throw new AppError(
              ErrorCode.CONFLICT,
              "Idempotency key already used for a different operation",
              409,
            );
          }

          return existing;
        }

        //2. otherwise find wallet and make reservation
        const wallet = await tx.creditWallet.findUnique({
          where: {
            agentId: input.agentId,
          },
        });
        if (!wallet) {
          throw new AppError(
            ErrorCode.INSUFFICIENT_CREDITS,
            "Insufficient credits",
            402,
          );
        }

        //make credit reservation
        const result = await tx.creditWallet.updateMany({
          where: {
            id: wallet.id,

            availableCredits: {
              gte: input.credits,
            },
          },
          data: {
            availableCredits: {
              decrement: input.credits,
            },

            reservedCredits: {
              increment: input.credits,
            },
          },
        });

        if (result.count !== 1) {
          throw new AppError(
            ErrorCode.INSUFFICIENT_CREDITS,
            "Insufficient credits",
            402,
          );
        }

        return tx.creditReservation.create({
          data: {
            walletId: wallet.id,
            operation: input.operation,
            reservedCredits: input.credits,
            idempotencyKey: input.idempotencyKey,
            expiresAt: input.expiresAt,
          },
        });
      });
    } catch (error) {
      /*
       * Two identical requests may race.
       *
       * One successfully creates the reservation.
       * The other's transaction rolls back because
       * idempotencyKey is UNIQUE.
       *
       * We then return the already-created reservation.
       */

      if (this.hasPrismaCode(error, "P2002")) {
        const existing = await this.db.creditReservation.findUnique({
          where: {
            idempotencyKey: input.idempotencyKey,
          },
          include: {
            wallet: true,
          },
        });

        if (
          existing &&
          existing.wallet.agentId === input.agentId &&
          existing.operation === input.operation &&
          existing.reservedCredits === input.credits
        ) {
          return existing;
        }
      }
      throw error;
    }
  }

  ///
  async settle(input: SettleCreditsInput): Promise<void> {
    if (input.chargedCredits < 0n) {
      throw new AppError(
        ErrorCode.BAD_REQUEST,
        "Charged credits cannot be negative",
        400,
      );
    }

    await this.db.transaction(async (tx) => {
      const reservation = await tx.creditReservation.findUnique({
        where: {
          id: input.reservationId,
        },
      });

      if (!reservation) {
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_NOT_FOUND,
          "Credit reservation not found",
          404,
        );
      }

      /*
       * Calling settle twice with the same
       * amount should be harmless.
       */
      if (reservation.status === "SETTLED") {
        if (reservation.chargedCredits === input.chargedCredits) {
          return;
        }
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Reservation was already settled with a different amount",
          409,
        );
      }

      if (reservation.status !== "ACTIVE") {
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Reservation cannot be settled",
          409,
        );
      }

      if (input.chargedCredits > reservation.reservedCredits) {
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Charged credits exceed reserved credits",
          409,
        );
      }

      /*
       * Claim the reservation.
       *
       * Only one concurrent caller can move
       * ACTIVE -> SETTLED.
       */
      const claimed = await tx.creditReservation.updateMany({
        where: {
          id: reservation.id,
          status: "ACTIVE",
        },
        data: {
          status: "SETTLED",
          chargedCredits: input.chargedCredits,
          settledAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        const latest = await tx.creditReservation.findUnique({
          where: {
            id: reservation.id,
          },
        });

        if (
          latest?.status === "SETTLED" &&
          latest.chargedCredits === input.chargedCredits
        ) {
          return;
        }

        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Reservation is no longer active",
          409,
        );
      }

      const unusedCredits = reservation.reservedCredits - input.chargedCredits;

      await tx.creditWallet.update({
        where: {
          id: reservation.walletId,
        },
        data: {
          reservedCredits: {
            decrement: reservation.reservedCredits,
          },
          availableCredits: {
            increment: unusedCredits,
          },
        },
      });

      if (input.chargedCredits > 0n) {
        await tx.creditLedger.create({
          data: {
            walletId: reservation.walletId,
            type: "AI_CHARGE",
            amount: -input.chargedCredits,
            referenceId: reservation.id,
            description: `AI operation: ${reservation.operation}`,
          },
        });
      }
    });
  }

  //
  async release(input: ReleaseCreditsInput): Promise<void> {
    await this.db.transaction(async (tx) => {
      const reservation = await tx.creditReservation.findUnique({
        where: {
          id: input.reservationId,
        },
      });

      if (!reservation) {
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_NOT_FOUND,
          "Credit reservation not found",
          404,
        );
      }

      /*
       * Release is idempotent.
       */
      if (reservation.status === "RELEASED") {
        return;
      }

      if (reservation.status !== "ACTIVE") {
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Reservation cannot be released",
          409,
        );
      }

      const claimed = await tx.creditReservation.updateMany({
        where: {
          id: reservation.id,
          status: "ACTIVE",
        },
        data: {
          status: "RELEASED",
          releasedAt: new Date(),
        },
      });

      if (claimed.count !== 1) {
        const latest = await tx.creditReservation.findUnique({
          where: {
            id: reservation.id,
          },
        });

        if (latest?.status === "RELEASED") {
          return;
        }
        throw new AppError(
          ErrorCode.CREDIT_RESERVATION_INVALID,
          "Reservation is no longer active",
          409,
        );
      }

      await tx.creditWallet.update({
        where: {
          id: reservation.walletId,
        },
        data: {
          reservedCredits: {
            decrement: reservation.reservedCredits,
          },
          availableCredits: {
            increment: reservation.reservedCredits,
          },
        },
      });
    });
  }
}
