import { useQuery } from "@tanstack/react-query"
import { getDepartments, getFaculty } from "./faculty-api"

export function useFacultyQuery() {
  return useQuery({
    queryKey: ["faculty"],
    queryFn: getFaculty,
  })
}

export function useDepartmentsQuery() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: getDepartments,
  })
}
