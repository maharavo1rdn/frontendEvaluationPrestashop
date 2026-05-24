import { Routes, Route } from "react-router-dom";
import CommandeList from "../../pages/order/CommandeList";
import CommandeDetail from "../../pages/order/CommandeDetail";
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
        <Route path="/orders/:id" element={<CommandeDetail />}></Route>
      </Routes>
    </>
  );
};
export default CommandesRoutes;
