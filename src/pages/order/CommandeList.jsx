import { useEffect, useState } from "react";
import { getAll } from "../../services/order.service";

const CommandeList = () => {
  const [orders, setOrders] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {}, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const orders = await getAll();
      setOrders(orders);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
    const handleUpdateState = async (id) => {
      try {
        // const 
      } catch (error) {
        setStatus(error.message);
      }
    };
  };

  return <></>;
};
export default CommandeList;
