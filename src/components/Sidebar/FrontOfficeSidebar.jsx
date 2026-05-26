import { Box, LogOut, Receipt, ShoppingCart } from "lucide-react";
import Sidebar from "./Sidebar";
import { useAuth } from "../../pages/auth/AuthContext";
import { useNavigate } from "react-router-dom";

const FRONTOFFICE_ITEMS = [
  {
    id: "products",
    label: "Products",
    icon: Box,
    path: "/frontOffice/products",
  },
  {
    id: "cart",
    label: "Panier",
    icon: ShoppingCart,
    path: "/frontOffice/cart",
  },
  {
    id: "order",
    label: "Mes commandes",
    icon: Receipt,
    path: "/frontOffice/commandes/customers",
  },
  {
    id: "Stock",
    label: "Stock",
    icon: Receipt,
    path: "/frontOffice/removeStock",
  },
];

const FrontOfficeSidebar = ({ collapsed, onToggle }) => {
  const { logoutAll } = useAuth();
  const navigate = useNavigate();

  const footerItems = [
    {
      id: "logout",
      label: "Deconnexion",
      icon: LogOut,
      path: "/",
      onClick: () => {
        logoutAll();
        navigate("/");
      },
    },
  ];

  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      navItems={FRONTOFFICE_ITEMS}
      footerItems={footerItems}
      brandLabel="Front office"
    />
  );
};

export default FrontOfficeSidebar;
