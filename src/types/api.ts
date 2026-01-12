// src/types/api.ts
export type ApiSuccess<T, M = unknown> = {
  success: true;
  data: T;
  meta?: M;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "CONFLICT"
    | "RATE_LIMITED"
    | "INTERNAL_ERROR"
    | string;
    message: string;
    details?: any;
  };
};

export type ApiResponse<T, M = unknown> = ApiSuccess<T, M> | ApiErrorBody;

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(opts: { code: string; message: string; status: number; details?: any }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
  }
}