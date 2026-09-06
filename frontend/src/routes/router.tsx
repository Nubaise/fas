import { createBrowserRouter } from "react-router-dom"
import App from "@/App"
import { AppShell } from "@/components/shared/AppShell"
import { ProtectedRoute } from "./guards/ProtectedRoute"
import { RoleRoute } from "./guards/RoleRoute"
import { routes } from "./routes"
import { LoginPage } from "@/features/auth/LoginPage"

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
                    element: <div>Student Area</div>,
                  },
                ],
              },
              {
                element: <RoleRoute allowedRoles={["FACULTY"]} />,
                children: [
                  {
                    path: routes.faculty.slice(1),
                    element: <div>Faculty Area</div>,
                  },
                ],
              },
              {
                element: <RoleRoute allowedRoles={["ADMIN"]} />,
                children: [
                  {
                    path: routes.admin.slice(1),
                    element: <div>Admin Area</div>,
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
