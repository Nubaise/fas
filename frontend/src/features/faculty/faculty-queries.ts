import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  getDepartments,
  getFaculty,
  updateFaculty,
  type UpdateFacultyRequest,
} from "./faculty-api"

import type { Faculty } from "./faculty.types"

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

export function useUpdateFacultyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateFacultyRequest
    }) => updateFaculty(id, data),

    onSuccess: (faculty) => {
      queryClient.setQueryData<Faculty[]>(
        ["faculty"],
        (currentFaculty) =>
          currentFaculty?.map((item) =>
            item.id === faculty.id ? faculty : item,
          ),
      )

      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      })
    },
  })
}
