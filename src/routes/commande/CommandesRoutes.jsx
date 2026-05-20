import { Routes, Route } from "react-router-dom";
import CommandeList from "../../pages/order/CommandeList";
import CustomerOrderList from "../../pages/order/CustomerOrderList";
import { CustomerProtectedRoute } from "../../pages/auth/CustomerProtectedRoute";
import { EmployeeProtectedRoute } from "../../pages/auth/EmployeeProtectedRoute";
const CommandesRoutes = () => {
  return (
    <>
      <Routes>
        <Route
          path="/backOffice/commandes"
          element={
            <EmployeeProtectedRoute>
              <CommandeList />
            </EmployeeProtectedRoute>
          }
        />
        <Route
          path="/frontOffice/commandes/customers"
          element={
            <CustomerProtectedRoute>
              <CustomerOrderList />
            </CustomerProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};
export default CommandesRoutes;
