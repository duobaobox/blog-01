import { NextResponse } from "next/server";
import {
  AppError,
  ConflictError,
  ConfigurationError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/app-error";

export function getErrorStatus(error: unknown, fallbackStatus = 500): number {
  if (error instanceof UnauthorizedError) {
    return 401;
  }

  if (error instanceof ForbiddenError) {
    return 403;
  }

  if (error instanceof ValidationError) {
    return 400;
  }

  if (error instanceof NotFoundError) {
    return 404;
  }

  if (error instanceof ConflictError) {
    return 409;
  }

  if (error instanceof ConfigurationError) {
    return 500;
  }

  if (error instanceof AppError) {
    return 400;
  }

  return fallbackStatus;
}

export function getPublicErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (
    error instanceof UnauthorizedError ||
    error instanceof ForbiddenError ||
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError
  ) {
    return error.message;
  }

  return fallbackMessage;
}

export function toErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 500,
) {
  return NextResponse.json(
    { error: getPublicErrorMessage(error, fallbackMessage) },
    { status: getErrorStatus(error, fallbackStatus) },
  );
}
