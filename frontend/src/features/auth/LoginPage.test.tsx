import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { LoginPage } from "./LoginPage"

const mockLogin = vi.fn()

vi.mock("./AuthProvider", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}))

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    render(<LoginPage />)

    expect(
      screen.getByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument()

    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Sign in" }),
    ).toBeInTheDocument()
  })
})
