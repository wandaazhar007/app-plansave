// src/services/apiClient.ts
import { ApiError, type ApiResponse } from "../types/api";
import { getFirebaseIdToken } from "../lib/auth/getIdToken";

const BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5014/api/v1";

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * fetch wrapper:
 * - inject Bearer token dari Firebase
 * - parse response format { success: true/false }
 * - throw ApiError ketika success=false / http error
 */
export async function apiRequest<T, M = unknown>(opts: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  signal?: AbortSignal;
  minDelayMs?: number; // untuk skeleton "lebih lama"
}): Promise<{ data: T; meta?: M }> {
  const method = opts.method ?? "GET";
  const url = buildUrl(opts.path, opts.query);

  const token = await getFirebaseIdToken();
  if (!token) {
    throw new ApiError({
      code: "UNAUTHORIZED",
      message: "You need to sign in again.",
      status: 401,
    });
  }

  const started = Date.now();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  const minDelay = opts.minDelayMs ?? 0;
  const elapsed = Date.now() - started;
  if (minDelay > elapsed) await sleep(minDelay - elapsed);

  let json: ApiResponse<T, M> | null = null;
  try {
    json = (await res.json()) as ApiResponse<T, M>;
  } catch {
    // fallback when non-json
  }

  if (!res.ok) {
    // prefer backend error format
    if (json && "success" in json && json.success === false) {
      throw new ApiError({
        code: json.error.code ?? "INTERNAL_ERROR",
        message: json.error.message ?? "Something went wrong. Please try again.",
        status: res.status,
        details: json.error.details,
      });
    }

    throw new ApiError({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
      status: res.status,
    });
  }

  if (!json) {
    throw new ApiError({
      code: "INTERNAL_ERROR",
      message: "Unexpected server response. Please try again.",
      status: res.status,
    });
  }

  if (json.success === false) {
    throw new ApiError({
      code: json.error.code ?? "INTERNAL_ERROR",
      message: json.error.message ?? "Something went wrong. Please try again.",
      status: res.status,
      details: json.error.details,
    });
  }

  return { data: json.data, meta: json.meta };
}