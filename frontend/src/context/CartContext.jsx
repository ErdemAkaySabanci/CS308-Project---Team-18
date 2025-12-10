import { createContext, useContext, useState } from "react";
import { cartService } from "../services/cartService";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);

  // 🔹 Backend'den cart yükle
  const fetchCart = async () => {
    try {
      const data = await cartService.getCart();
      if (data) setCart(data);
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  };

  // 🔹 Add to Cart (backend POST)
  const addToCart = async (product) => {
    try {
      const result = await cartService.addToCart(product.id);

      console.log("AddToCart result:", result);

      if (result && Array.isArray(result.items)) {
        await fetchCart();
        return true;
      }

      return false;

    } catch (err) {
      console.error("AddToCart error:", err);
      return false;
    }
  };

  // 🔹 Remove item
  const removeFromCart = async (itemId) => {
    try {
      const updated = await cartService.removeItem(itemId);
      if (updated) setCart(updated);
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  // 🔹 Update quantity
  const updateQuantity = async (itemId, qty) => {
    try {
      const updated = await cartService.updateItem(itemId, qty);
      if (updated && !updated.error) {
        setCart(updated);
      } else {
        alert(updated.error);
      }
    } catch (err) {
      console.error("Update quantity error:", err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        fetchCart,
        refreshCart: fetchCart,   // 🔥 EKLENEN SATIR (HATAYI ÇÖZÜYOR)
        addToCart,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
