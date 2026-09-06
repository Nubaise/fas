import { afterEach, describe, expect, it } from "vitest"
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token-storage"

describe("token storage", () => {
  afterEach(() => {
    sessionStorage.clear()
  })

  it("stores and retrieves an access token", () => {
    setAccessToken("test-token")

    expect(getAccessToken()).toBe("test-token")
  })

  it("clears the access token", () => {
    setAccessToken("test-token")

    clearAccessToken()

    expect(getAccessToken()).toBeNull()
  })
})
