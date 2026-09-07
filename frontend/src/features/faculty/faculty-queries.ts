import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  bulkOnboardFaculty,
  createDepartment,
  deleteDepartment,
  getDepartments,
  getFaculty,
  onboardFaculty,
  updateDepartment,
  updateFaculty,
  type BulkOnboardFacultyRequest,
  type CreateDepartmentRequest,
  type OnboardFacultyRequest,
  type UpdateDepartmentRequest,
  type UpdateFacultyRequest,
} from "./faculty-api"

import type {
  Department,
  Faculty,
} from "./faculty.types"

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

export function useOnboardFacultyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: OnboardFacultyRequest) => onboardFaculty(data),

    onSuccess: (faculty) => {
      queryClient.setQueryData<Faculty[]>(
        ["faculty"],
        (currentFaculty) =>
          currentFaculty
            ? [...currentFaculty, faculty]
            : [faculty],
      )

      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      })
    },
  })
}

export function useBulkOnboardFacultyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkOnboardFacultyRequest) =>
      bulkOnboardFaculty(data),

    onSuccess: (result) => {
      if (result.successful.length > 0) {
        queryClient.setQueryData<Faculty[]>(
          ["faculty"],
          (currentFaculty) =>
            currentFaculty
              ? [...currentFaculty, ...result.successful]
              : result.successful,
        )
      }

      queryClient.invalidateQueries({
        queryKey: ["faculty"],
      })
    },
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

export function useCreateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDepartmentRequest) =>
      createDepartment(data),

    onSuccess: (department) => {
      queryClient.setQueryData<Department[]>(
        ["departments"],
        (currentDepartments) =>
          currentDepartments
            ? [...currentDepartments, department]
            : [department],
      )

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      })
    },
  })
}

export function useUpdateDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateDepartmentRequest
    }) => updateDepartment(id, data),

    onSuccess: (department) => {
      queryClient.setQueryData<Department[]>(
        ["departments"],
        (currentDepartments) =>
          currentDepartments?.map((item) =>
            item.id === department.id
              ? department
              : item,
          ),
      )

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      })
    },
  })
}

export function useDeleteDepartmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),

    onSuccess: (_, id) => {
      queryClient.setQueryData<Department[]>(
        ["departments"],
        (currentDepartments) =>
          currentDepartments?.filter(
            (department) => department.id !== id,
          ),
      )

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      })
    },
  })
}
