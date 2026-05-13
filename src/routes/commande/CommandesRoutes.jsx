import { Routes, Route } from "react-router-dom";
import CommandeList from "../../pages/order/CommandeList";
const CommandesRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/commandes" element={<CommandeList />} />
      </Routes>
    </>
  );
};
export default CommandesRoutes;
