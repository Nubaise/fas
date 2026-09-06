import { describe, expect, it } from "vitest"
import { ApiError } from "./errors"

describe("ApiError", () => {
  it("stores API error details", () => {
    const error = new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
      details: { reason: "expired" },
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("ApiError")
    expect(error.status).toBe(401)
    expect(error.code).toBe("UNAUTHORIZED")
    expect(error.message).toBe("Invalid credentials")
    expect(error.details).toEqual({ reason: "expired" })
  })
})
