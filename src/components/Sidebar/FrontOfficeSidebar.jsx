import { Box, Receipt, ShoppingCart } from "lucide-react";
import Sidebar from "./Sidebar";

const FRONTOFFICE_ITEMS = [
  {
    id: "products",
    label: "Products",
    icon: Box,
    children: [
      { id: "products-list", label: "Liste", path: "/frontOffice/products" },
    ],
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
];

const FrontOfficeSidebar = ({ collapsed, onToggle }) => {
  return (
    <Sidebar
      collapsed={collapsed}
      onToggle={onToggle}
      navItems={FRONTOFFICE_ITEMS}
      brandLabel="Front office"
    />
  );
};

export default FrontOfficeSidebar;
