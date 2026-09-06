import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "./client"

vi.mock("@/features/auth/token-storage", () => ({
  getAccessToken: vi.fn(() => "test-token"),
}))

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("adds the access token as a Bearer authorization header", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      )

    await apiClient<{ ok: boolean }>("/api/v1/test")

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/test",
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    )

    const requestOptions = fetchMock.mock.calls[0]?.[1]
    const headers = requestOptions?.headers as Headers

    expect(headers.get("Authorization")).toBe("Bearer test-token")
    expect(headers.get("Accept")).toBe("application/json")
  })
})
