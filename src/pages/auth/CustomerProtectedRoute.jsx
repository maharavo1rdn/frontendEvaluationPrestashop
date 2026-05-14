import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const CustomerProtectedRoute = ({ children }) => {
  const { isCustomerAuthenticated } = useAuth();

  if (!isCustomerAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
