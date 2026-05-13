import { Routes, Route } from "react-router-dom";
import CommandeList from "../../pages/order/CommandeList";
import CustomerOrderList from "../../pages/order/CustomerOrderList";
const CommandesRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/backOffice/commandes" element={<CommandeList />} />
        <Route path="/frontOffice/commandes/customers" element={<CustomerOrderList />} />
      </Routes>
    </>
  );
};
export default CommandesRoutes;
