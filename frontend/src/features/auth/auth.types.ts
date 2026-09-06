export type Role = "STUDENT" | "FACULTY" | "ADMIN"

export type AuthenticatedUser = {
  id: string
  role: Role
}
