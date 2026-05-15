import { Navigate, Routes, Route } from "react-router-dom";
import ClientsRoutes from "./client/ClientsRoutes";
import ProduitsRoutes from "./produit/ProduitsRoutes";
import CartRoutes from "./cart/CartRoutes";
import ResetTable from "../pages/reset/ResetTable";
import ImportRoutes from "./import/ImportRoutes";
import FrontOfficeLogin from "../pages/auth/FrontOfficeLogin";
import BackOfficeLogin from "../pages/auth/BackOfficeLogin";
import CommandesRoutes from "./commande/CommandesRoutes";
import UserSelector from "../pages/auth/UserSelector";
import Dashboard from "../pages/dashboard/Dashboard";
import { EmployeeProtectedRoute } from "../pages/auth/EmployeeProtectedRoute";
import { CustomerProtectedRoute } from "../pages/auth/CustomerProtectedRoute";
import { AuthProvider } from "../pages/auth/AuthContext";

export default function AppRoutes() {
  return (
    <>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<FrontOfficeLogin />} />
          <Route path="/backoffice" element={<BackOfficeLogin />} />
          <Route
            path="/backOffice/dashboard"
            element={
              <EmployeeProtectedRoute>
                <Dashboard />
              </EmployeeProtectedRoute>
            }
          />
          <Route
            path="/backOffice/reset"
            element={
              <EmployeeProtectedRoute>
                <ResetTable />
              </EmployeeProtectedRoute>
            }
          />
          <Route
            path="/frontOffice/userSelector"
            element={
              <CustomerProtectedRoute>
                <UserSelector />
              </CustomerProtectedRoute>
            }
          />
        </Routes>
        <ClientsRoutes />
        <ProduitsRoutes />
        <CartRoutes />
        <CommandesRoutes />
        <ImportRoutes />
      </AuthProvider>
    </>
  );
}
