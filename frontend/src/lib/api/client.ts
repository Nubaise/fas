import { getAccessToken } from "@/features/auth/token-storage"
import { env } from "@/config/env"
import { ApiError } from "./errors"

type ApiRequestOptions = RequestInit & {
  body?: BodyInit | null
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type")

  if (contentType?.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

export async function apiClient<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const accessToken = getAccessToken()

  const headers = new Headers(options.headers)
  headers.set("Accept", "application/json")

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const body = await parseResponseBody(response)

    const errorBody =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : undefined

    throw new ApiError({
      status: response.status,
      code:
        typeof errorBody?.code === "string"
          ? errorBody.code
          : undefined,
      message:
        typeof errorBody?.message === "string"
          ? errorBody.message
          : response.statusText || "Request failed",
      details: errorBody?.details,
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await parseResponseBody(response)) as T
}
