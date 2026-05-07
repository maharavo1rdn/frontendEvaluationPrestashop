import { useEffect, useState } from "react";
import { resetGuests } from "../services/guest.service";

const Dashboard = () => {
    const [error, setError] = useState();
    const handleDeleteAllGuest = () => {
      try {
          resetGuests();
      } catch (error) {
          setError(error.message)
      }
    };
  return (
    <>
      <h1>Bonjour</h1>
      <button onClick={handleDeleteAllGuest}>Reset guest</button>
    </>
  );
};
export default Dashboard;
