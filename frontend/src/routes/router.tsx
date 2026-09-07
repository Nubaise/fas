import { createBrowserRouter } from "react-router-dom"

import App from "@/App"
import { AppShell } from "@/components/shared/AppShell"
import { LoginPage } from "@/features/auth/LoginPage"

import { StudentDashboardPage } from "@/features/student/StudentDashboardPage"
import { StudentFacultyPage } from "@/features/faculty/StudentFacultyPage"
import { StudentFacultyDetailPage } from "@/features/faculty/StudentFacultyDetailPage"

import { FacultyDashboardPage } from "@/features/faculty/FacultyDashboardPage"
import { FacultyProfilePage } from "@/features/faculty/FacultyProfilePage"
import { FacultyAvailabilityPage } from "@/features/availability/FacultyAvailabilityPage"

import { FacultyAppointmentsPage } from "@/features/appointments/FacultyAppointmentsPage"
import { FacultyAppointmentDetailPage } from "@/features/appointments/FacultyAppointmentDetailPage"
import { StudentBookingPage } from "@/features/appointments/StudentBookingPage"
import { StudentAppointmentsPage } from "@/features/appointments/StudentAppointmentsPage"
import { StudentAppointmentDetailPage } from "@/features/appointments/StudentAppointmentDetailPage"

import { AdminDashboardPage } from "@/features/admin/AdminDashboardPage"
import { AdminFacultyPage } from "@/features/admin/AdminFacultyPage"
import { AdminFacultyDetailPage } from "@/features/admin/AdminFacultyDetailPage"
import { AdminFacultyFormPage } from "@/features/admin/AdminFacultyFormPage"
import { AdminDepartmentsPage } from "@/features/admin/AdminDepartmentsPage"
import { AdminFacultyAvailabilityPage } from "@/features/admin/AdminFacultyAvailabilityPage"
import { AdminAppointmentsPage } from "@/features/admin/AdminAppointmentsPage"
import { AdminAppointmentDetailPage } from "@/features/admin/AdminAppointmentDetailPage"

import { ProtectedRoute } from "./guards/ProtectedRoute"
import { RoleRoute } from "./guards/RoleRoute"
import { routes } from "./routes"

export const router = createBrowserRouter([
  {
    path: routes.home,
    element: <App />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <div>FAS Frontend</div>,
          },
          {
            path: routes.login.slice(1),
            element: <LoginPage />,
          },
          {
            element: <ProtectedRoute />,
            children: [
              {
                element: <RoleRoute allowedRoles={["STUDENT"]} />,
                children: [
                  {
                    path: routes.student.slice(1),
                    element: <StudentDashboardPage />,
                  },
                  {
                    path: `${routes.student.slice(1)}/faculty`,
                    element: <StudentFacultyPage />,
                  },
                  {
                    path: `${routes.student.slice(1)}/faculty/:facultyId`,
                    element: <StudentFacultyDetailPage />,
                  },
                  {
                    path: `${routes.student.slice(1)}/appointments/new`,
                    element: <StudentBookingPage />,
                  },
                  {
                    path: `${routes.student.slice(1)}/appointments`,
                    element: <StudentAppointmentsPage />,
                  },
                  {
                    path: `${routes.student.slice(1)}/appointments/:appointmentId`,
                    element: <StudentAppointmentDetailPage />,
                  },
                ],
              },
              {
                element: <RoleRoute allowedRoles={["FACULTY"]} />,
                children: [
                  {
                    path: routes.faculty.slice(1),
                    element: <FacultyDashboardPage />,
                  },
                  {
                    path: `${routes.faculty.slice(1)}/profile`,
                    element: <FacultyProfilePage />,
                  },
                  {
                    path: `${routes.faculty.slice(1)}/availability`,
                    element: <FacultyAvailabilityPage />,
                  },
                  {
                    path: `${routes.faculty.slice(1)}/appointments`,
                    element: <FacultyAppointmentsPage />,
                  },
                  {
                    path: `${routes.faculty.slice(1)}/appointments/:appointmentId`,
                    element: <FacultyAppointmentDetailPage />,
                  },
                ],
              },
              {
                element: <RoleRoute allowedRoles={["ADMIN"]} />,
                children: [
                  {
                    path: routes.admin.slice(1),
                    element: <AdminDashboardPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/faculty`,
                    element: <AdminFacultyPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/faculty/:facultyId`,
                    element: <AdminFacultyDetailPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/faculty/new`,
                    element: <AdminFacultyFormPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/faculty/:facultyId/edit`,
                    element: <AdminFacultyFormPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/faculty/:facultyId/availability`,
                    element: <AdminFacultyAvailabilityPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/departments`,
                    element: <AdminDepartmentsPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/appointments`,
                    element: <AdminAppointmentsPage />,
                  },
                  {
                    path: `${routes.admin.slice(1)}/appointments/:appointmentId`,
                    element: <AdminAppointmentDetailPage />,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
])
