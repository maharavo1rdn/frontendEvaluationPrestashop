import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const CustomerProtectedRoute = ({ children }) => {
  const { isCustomerAuthenticated, isGuestAuthenticated } = useAuth();

  if (!isCustomerAuthenticated && !isGuestAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};
