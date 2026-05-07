import { Routes, Route } from "react-router-dom";
import ClientCreate from "../../pages/client/ClientCreate";
import ClientList from "../../pages/client/ClientList";
const ClientsRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/client" element={<ClientList />} />
        <Route path="/client/create" element={<ClientCreate />} />
      </Routes>
    </>
  );
};
export default ClientsRoutes;
