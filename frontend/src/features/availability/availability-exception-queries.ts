import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  createAvailabilityException,
  deleteAvailabilityException,
  getFacultyExceptions,
  updateAvailabilityException,
  type CreateAvailabilityExceptionRequest,
  type UpdateAvailabilityExceptionRequest,
} from "./availability-exception-api"

export function useFacultyExceptionsQuery(
  facultyId: string,
) {
  return useQuery({
    queryKey: ["faculty", facultyId, "exceptions"],
    queryFn: () => getFacultyExceptions(facultyId),
    enabled: Boolean(facultyId),
  })
}

export function useCreateAvailabilityExceptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAvailabilityExceptionRequest) =>
      createAvailabilityException(data),

    onSuccess: (exception) => {
      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          exception.facultyId,
          "exceptions",
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          exception.facultyId,
          "availability",
        ],
      })
    },
  })
}

export function useUpdateAvailabilityExceptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateAvailabilityExceptionRequest
    }) => updateAvailabilityException(id, data),

    onSuccess: (exception) => {
      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          exception.facultyId,
          "exceptions",
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          exception.facultyId,
          "availability",
        ],
      })
    },
  })
}

export function useDeleteAvailabilityExceptionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
    }: {
      id: string
      facultyId: string
    }) => deleteAvailabilityException(id),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          variables.facultyId,
          "exceptions",
        ],
      })

      queryClient.invalidateQueries({
        queryKey: [
          "faculty",
          variables.facultyId,
          "availability",
        ],
      })
    },
  })
}
