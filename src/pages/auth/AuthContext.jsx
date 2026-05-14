import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("admin_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("customer_session");
    return saved ? JSON.parse(saved) : null;
  });

  const loginAdmin = (data) => {
    setAdmin(data);
    localStorage.setItem("admin_session", JSON.stringify(data));
  };

  const loginCustomer = (data) => {
    setCustomer(data);
    localStorage.setItem("customer_session", JSON.stringify(data));
  };

  const logoutAll = () => {
    setAdmin(null);
    setCustomer(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loginAdmin,
        customer,
        loginCustomer,
        logoutAll,
        isAdminAuthenticated: !!admin,
        isCustomerAuthenticated: !!customer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être dans AuthProvider");
  return context;
};
