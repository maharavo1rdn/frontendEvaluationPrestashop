import { Box, ShoppingCart } from "lucide-react";
import Sidebar from "./Sidebar";

const FRONTOFFICE_ITEMS = [
  {
    id: "products",
    label: "Products",
    icon: Box,
    children: [{ id: "products-list", label: "Liste", path: "/products" }],
  },
  {
    id: "cart",
    label: "Panier",
    icon: ShoppingCart,
    children: [{ id: "cart-view", label: "Voir", path: "/cart" }],
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
