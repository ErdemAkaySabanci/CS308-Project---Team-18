import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadCart();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const loadCart = async () => {
        try {
            setLoading(true);
            const data = await apiService.getCart();
            console.log('Cart data:', data);
            setCart(data);
        } catch (err) {
            console.error('Load cart error:', err);
            setError("Failed to load cart.");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, newQty) => {
        if (newQty < 1) {
            removeItem(itemId, true);
            return;
        }

        try {
            const result = await apiService.updateCartItem(itemId, newQty);
            if (result && result.error) {
                showToast(result.error, 'error');
            } else {
                setCart(result);
            }
        } catch (err) {
            console.error('Update error:', err);
            showToast('Could not update quantity', 'error');
            await loadCart();
        }
    };

    const removeItem = async (itemId, skipConfirm = false) => {
        if (!skipConfirm && !window.confirm("Remove this item?")) return;

        try {
            const result = await apiService.deleteCartItem(itemId);
            setCart(result);
            showToast('Item removed', 'success');
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Could not remove item', 'error');
        }
    };

    const checkout = async () => {
        try {
            await apiService.checkout();
            showToast('Order Created!', 'success');
            setTimeout(() => navigate("/orders"), 1500);
        } catch (err) {
            showToast('Cannot checkout. Please try again.', 'error');
        }
    };

    if (loading) {
        return (
            <div style={styles.centerContainer}>
                <p>Loading cart...</p>
            </div>
        );
    }
    
    if (error) return <div style={styles.centerContainer}>{error}</div>;

    const cartItems = cart?.items || [];
    
    if (!cart || cartItems.length === 0) {
        return (
            <div style={styles.centerContainer}>
                <h2>Your cart is empty</h2>
                <Link to="/" style={styles.startShoppingButton}>Start Shopping</Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Toast */}
            {toast.show && (
                <div style={{
                    ...styles.toast,
                    backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444'
                }}>
                    {toast.message}
                </div>
            )}

            <h1 style={styles.title}>Shopping Cart</h1>

            <div style={styles.content}>
                <div style={styles.itemsList}>
                    {cartItems.map(item => {
                        const price = Number(item.product_price || item.price || 0);
                        const subtotal = Number(item.subtotal) || (item.quantity * price);
                        
                        return (
                            <div key={item.id} style={styles.itemCard}>
                                <div style={styles.itemDetails}>
                                    <h3 style={styles.itemName}>{item.product_name || item.name}</h3>
                                    <p style={styles.itemPrice}>{price} TL</p>
                                </div>

                                <div style={styles.quantityControls}>
                                    <button 
                                        style={styles.qtyButton}
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        -
                                    </button>
                                    <span style={styles.qtyValue}>{item.quantity}</span>
                                    <button 
                                        style={styles.qtyButton}
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <div style={styles.itemTotal}>
                                    {subtotal} TL
                                </div>

                                <button 
                                    onClick={() => removeItem(item.id)} 
                                    style={styles.removeButton}
                                >
                                    🗑️
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* SUMMARY */}
                <div style={styles.summary}>
                    <h2>Order Summary</h2>

                    <div style={styles.summaryRow}>
                        <span>Total</span>
                        <strong>{cart.total_price || 0} TL</strong>
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
    title: { fontSize: "32px", fontWeight: "700", marginBottom: "24px" },
    content: { display: "grid", gridTemplateColumns: "1fr 350px", gap: "40px" },
    itemsList: { display: "flex", flexDirection: "column", gap: "16px" },
    itemCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    },
    itemDetails: { flex: 1 },
    itemName: { margin: 0, fontSize: "18px", fontWeight: 600 },
    itemPrice: { margin: "4px 0", color: "#777" },
    quantityControls: { 
        display: "flex", 
        alignItems: "center", 
        gap: "12px",
        backgroundColor: "#f5f5f5",
        padding: "8px 12px",
        borderRadius: "8px",
    },
    qtyButton: {
        width: "32px",
        height: "32px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        background: "#fff",
        cursor: "pointer",
        fontSize: "18px",
        fontWeight: "600",
    },
    qtyValue: {
        fontSize: "16px",
        fontWeight: "600",
        minWidth: "24px",
        textAlign: "center",
    },
    itemTotal: { fontSize: "18px", fontWeight: 600, color: "#F97316", minWidth: "100px", textAlign: "right" },
    removeButton: { border: "none", background: "none", cursor: "pointer", fontSize: "20px" },
    summary: {
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        height: "fit-content",
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
    toast: {
        position: "fixed",
        top: "100px",
        right: "24px",
        padding: "16px 24px",
        borderRadius: "12px",
        color: "#fff",
        fontWeight: "600",
        zIndex: 9999,
    },
};

export default CartPage;
