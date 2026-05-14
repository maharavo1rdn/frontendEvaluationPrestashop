import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const EmployeeProtectedRoute = ({ children }) => {
  const { isAdminAuthenticated } = useAuth();

  if (!isAdminAuthenticated) {
    return <Navigate to="/backoffice" replace />;
  }

  return children;
};