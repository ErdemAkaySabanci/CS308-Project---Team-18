import React, { useEffect, useState } from "react";
import { apiService } from "../services/apiService";

function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrderHistory();
      setOrders(data.results ?? data);
    } catch (err) {
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading your orders...</div>;

  if (error)
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={loadOrders}>Retry</button>
      </div>
    );

  return (
    <div style={{ padding: "40px" }}>
      <h1>My Orders</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "20px",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <h3>Order #{order.id}</h3>

              {/* 📌 Sipariş DURUMU BURAYA EKLENDİ */}
              <p>
                Status:{" "}
                <strong style={{ textTransform: "capitalize" }}>
                  {order.status}
                </strong>
              </p>

              <p>Invoice: {order.invoice_number}</p>
              <p>{new Date(order.created_at).toLocaleString()}</p>
            </div>

            <div>
              <button
                onClick={() =>
                  setOpenOrderId((prev) => (prev === order.id ? null : order.id))
                }
                style={{
                  padding: "8px 16px",
                  background: "#f6c340",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View Items
              </button>
              <h3 style={{ marginTop: "10px", textAlign: "right" }}>
                {order.total_price} TL
              </h3>
            </div>
          </div>

          {/* 🟦 ÜRÜNLERİ AÇ/KAPA */}
          {openOrderId === order.id && (
            <div
              style={{
                marginTop: "20px",
                borderTop: "1px solid #ddd",
                paddingTop: "15px",
              }}
            >
              <h4>Items</h4>

              {order.items.map((item) => {
                const img =
                  item.product_image ||
                  item.image ||
                  "https://via.placeholder.com/50";

                const name =
                  item.product_name || item.name || "Unnamed Product";

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src={img}
                        alt={name}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "8px",
                          objectFit: "cover",
                        }}
                      />
                      <span>{name}</span>
                    </div>

                    <span>x{item.quantity}</span>
                    <strong>{item.subtotal} TL</strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default OrderHistoryPage;
