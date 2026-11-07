const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ApiResult<T = unknown> = {
  success?: boolean;
  message?: string;
  errors?: Array<{ field?: string; message?: string }>;
  data?: T;
  user?: T;
  accessToken?: string;
  [key: string]: unknown;
};

export async function apiRequest<T = ApiResult>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfResponse = await fetch(`${API_URL}/csrf-token`, {
      credentials: "include",
    });

    if (!csrfResponse.ok) {
      throw new Error(`Unable to prepare request (${csrfResponse.status})`);
    }

    const csrfResult = (await csrfResponse.json()) as {
      csrfToken?: string;
    };

    if (!csrfResult.csrfToken) {
      throw new Error("The API did not provide a CSRF token.");
    }

    headers.set("X-CSRF-Token", csrfResult.csrfToken);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = Array.isArray(result.errors)
      ? result.errors
          .filter(
            (error): error is { field?: string; message: string } =>
              typeof error?.message === "string"
          )
          .map((error) =>
            error.field ? `${error.field}: ${error.message}` : error.message
          )
      : [];

    throw new Error(
      validationErrors.length > 0
        ? `${result.message || "Invalid request data"}: ${validationErrors.join("; ")}`
        : result.message || result.error || `Request failed (${response.status})`
    );
  }

  return result as T;
}