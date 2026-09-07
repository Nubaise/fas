import { describe, expect, it, vi } from "vitest"
import { createAppointment, getAppointment, getAppointments } from "./appointment-api"
import { apiClient } from "@/lib/api/client"

vi.mock("@/lib/api/client", () => ({
  apiClient: vi.fn(),
}))

describe("appointment API", () => {
  it("creates an appointment with the expected request", async () => {
    const appointment = {
      id: "appointment-1",
      facultyId: "faculty-1",
      startTime: "2026-09-07T10:00:00+05:30",
      endTime: "2026-09-07T10:30:00+05:30",
      reason: "Discuss project",
      status: "PENDING",
    }

    vi.mocked(apiClient).mockResolvedValueOnce(appointment)

    const result = await createAppointment({
      facultyId: "faculty-1",
      startTime: "2026-09-07T10:00:00+05:30",
      endTime: "2026-09-07T10:30:00+05:30",
      reason: "Discuss project",
    })

    expect(result).toEqual(appointment)
    expect(apiClient).toHaveBeenCalledWith("/api/v1/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        facultyId: "faculty-1",
        startTime: "2026-09-07T10:00:00+05:30",
        endTime: "2026-09-07T10:30:00+05:30",
        reason: "Discuss project",
      }),
    })
  })

  it("gets the current student's appointments", async () => {
    const appointments = [
      {
        id: "appointment-1",
        facultyId: "faculty-1",
        startTime: "2026-09-07T10:00:00+05:30",
        endTime: "2026-09-07T10:30:00+05:30",
        reason: "Discuss project",
        status: "PENDING",
      },
    ]

    vi.mocked(apiClient).mockResolvedValueOnce(appointments)

    const result = await getAppointments()

    expect(result).toEqual(appointments)
    expect(apiClient).toHaveBeenCalledWith("/api/v1/appointments")
  })

  it("gets a single appointment by id", async () => {
    const appointment = {
      id: "appointment-1",
      facultyId: "faculty-1",
      startTime: "2026-09-07T10:00:00+05:30",
      endTime: "2026-09-07T10:30:00+05:30",
      reason: "Discuss project",
      status: "CONFIRMED",
    }

    vi.mocked(apiClient).mockResolvedValueOnce(appointment)

    const result = await getAppointment("appointment-1")

    expect(result).toEqual(appointment)
    expect(apiClient).toHaveBeenCalledWith(
      "/api/v1/appointments/appointment-1",
    )
  })
})
