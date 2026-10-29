/** Shared JSON response helpers so every API route answers the same shape. */

export type ApiErrorCode =
  | "validation_error"
  | "invalid_credentials"
  | "email_taken"
  | "unauthorized"
  | "bad_request"
  | "server_error";

export function jsonOk<T extends object>(data: T, status = 200): Response {
  return Response.json({ ok: true, ...data }, { status });
}

export function jsonError(code: ApiErrorCode, message: string, status: number): Response {
  return Response.json({ ok: false, code, message }, { status });
}

/** Parses a JSON body, returning null rather than throwing on malformed input. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const asString = (value: unknown): string => (typeof value === "string" ? value : "");
