import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { CartProvider } from "./context/CartContext";

// Önce root oluşturulacak
const root = ReactDOM.createRoot(document.getElementById("root"));

// Sonra CartProvider içinde App render edilecek
root.render(
  <React.StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </React.StrictMode>
);
