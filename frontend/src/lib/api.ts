/**
 * Minimal API client for the backend.
 * - Base URL comes from NEXT_PUBLIC_API_URL (falls back to local dev).
 * - Attaches the access token when available.
 * - Normalizes the backend's error shape into a thrown ApiError.
 */
import { getAccessToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];

  constructor(message: string, status: number, issues?: { path: string; message: string }[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    // Backend error shape: { statusCode, error: string | { message, issues } }
    const err = data?.error ?? data;
    const message =
      (typeof err === "string" ? err : err?.message) ?? "Something went wrong";
    throw new ApiError(message, res.status, err?.issues);
  }

  return data as T;
}
