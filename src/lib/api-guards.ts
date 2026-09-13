import { isValidObjectId } from "mongoose";
import { tooManyRequestsResponse } from "@/lib/api-responses";
import { checkRateLimit } from "@/lib/rate-limit";
import { getCurrentUserId, notFoundResponse, unauthorizedResponse } from "@/lib/session";

type RateLimitGuardOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type CurrentOwnerGuardResult =
  | {
      ok: true;
      ownerId: string;
    }
  | {
      ok: false;
      response: Response;
    };

export async function requireCurrentOwnerId(): Promise<CurrentOwnerGuardResult> {
  const ownerId = await getCurrentUserId();

  if (!ownerId) {
    return {
      ok: false,
      response: unauthorizedResponse()
    };
  }

  return {
    ok: true,
    ownerId
  };
}

export function rejectInvalidObjectId(value: string) {
  return isValidObjectId(value) ? null : notFoundResponse();
}

export function enforceRateLimit(options: RateLimitGuardOptions) {
  const rateLimit = checkRateLimit(options);

  return rateLimit.allowed
    ? null
    : tooManyRequestsResponse(rateLimit.retryAfterSeconds);
}
