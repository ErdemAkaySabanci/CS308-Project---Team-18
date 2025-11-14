import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import RegisterPage from "./pages/RegisterPage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />

        {/* Default olarak ürün listesi */}
        <Route path="/" element={<ProductListPage />} />
      </Routes>
    </Router>
  );
}

export default App;
