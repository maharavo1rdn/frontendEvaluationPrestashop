import { createContext, useContext, useState } from "react";
import {
  clearGuestSession,
  getGuestSession,
  saveCustomerSession,
  saveGuestSession,
} from "../../services/frontoffice/session.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem("admin_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [customer, setCustomer] = useState(() => {
    return getCustomerSession();
  });

  const [guest, setGuest] = useState(() => getGuestSession());

  const loginAdmin = (data) => {
    setAdmin(data);
    localStorage.setItem("admin_session", JSON.stringify(data));
  };

  const loginCustomer = (data) => {
    setCustomer(data);
    saveCustomerSession(data);
    clearGuestSession();
    setGuest(null);
  };

  const loginGuest = (data) => {
    clearGuestSession();
    saveGuestSession(data);
    setGuest(data);
  };

  const logoutAll = () => {
    setAdmin(null);
    setCustomer(null);
    setGuest(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loginAdmin,
        customer,
        loginCustomer,
        guest,
        loginGuest,
        logoutAll,
        isAdminAuthenticated: !!admin,
        isCustomerAuthenticated: !!customer,
        isGuestAuthenticated: !!(guest?.isGuest && guest?.id),
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
