import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = async () => {
        try {
            setLoading(true);
            const data = await apiService.getCart();
            setCart(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load cart.");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, newQty) => {
        if (newQty < 1) return;

        try {
            const updated = await apiService.updateCartItem(itemId, newQty);
            setCart(updated);
        } catch (err) {
            alert("Could not update quantity");
        }
    };

    const removeItem = async (itemId) => {
        if (!window.confirm("Remove this item?")) return;

        try {
            const updated = await apiService.deleteCartItem(itemId);
            setCart(updated);
        } catch (err) {
            alert("Could not remove item");
        }
    };

    const checkout = async () => {
        try {
            const result = await apiService.checkout();
            alert("Order Created!");
            navigate("/orders");
        } catch (err) {
            alert("Cannot checkout. Add address or login.");
        }
    };

    if (loading) return <div style={styles.centerContainer}>Loading cart...</div>;
    if (error) return <div style={styles.centerContainer}>{error}</div>;

    if (!cart || cart.items.length === 0) {
        return (
            <div style={styles.centerContainer}>
                <h2>Your cart is empty</h2>
                <Link to="/" style={styles.startShoppingButton}>Start Shopping</Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Shopping Cart</h1>

            <div style={styles.content}>
                <div style={styles.itemsList}>
                    {cart.items.map(item => (
                        <div key={item.id} style={styles.itemCard}>
                            
                            <div style={styles.itemDetails}>
                                <h3 style={styles.itemName}>{item.name}</h3>
                                <p style={styles.itemPrice}>{item.price} TL</p>
                            </div>

                            <div style={styles.quantityControls}>
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                            </div>

                            <div style={styles.itemTotal}>
                                {item.subtotal} TL
                            </div>

                            <button onClick={() => removeItem(item.id)} style={styles.removeButton}>
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                {/* SUMMARY */}
                <div style={styles.summary}>
                    <h2>Order Summary</h2>

                    <div style={styles.summaryRow}>
                        <span>Total</span>
                        <strong>{cart.total_price} TL</strong>
                    </div>

                    <button style={styles.checkoutButton} onClick={checkout}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: "1200px", margin: "0 auto", padding: "40px" },
    centerContainer: { textAlign: "center", marginTop: "20vh" },
    title: { fontSize: "32px", fontWeight: "700" },
    content: { display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px" },
    itemsList: { display: "flex", flexDirection: "column", gap: "24px" },
    itemCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
    },
    itemDetails: { flex: 1 },
    itemName: { margin: 0, fontSize: "18px", fontWeight: 600 },
    itemPrice: { margin: "4px 0", color: "#777" },
    quantityControls: { display: "flex", alignItems: "center", gap: "12px" },
    itemTotal: { fontSize: "18px", fontWeight: 600 },
    removeButton: { border: "none", background: "none", cursor: "pointer" },
    summary: {
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    summaryRow: {
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "20px",
        fontSize: "18px",
    },
    checkoutButton: {
        width: "100%",
        padding: "14px",
        background: "#2D5FFF",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        fontSize: "18px",
        cursor: "pointer",
    },
    startShoppingButton: {
        padding: "12px 20px",
        background: "#2D5FFF",
        color: "#fff",
        borderRadius: "10px",
        textDecoration: "none",
        fontWeight: 600,
    },
};

export default CartPage;
