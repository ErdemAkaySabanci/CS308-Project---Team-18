import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [showLoginModal, setShowLoginModal] = useState(false);
    const isLoggedIn = authService.isAuthenticated();
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

            // Check if user is logged in
            const token = localStorage.getItem('access_token');

            if (!token) {
                // Guest user - load from localStorage
                const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
                if (guestCart.length > 0) {
                    // We need product details, so fetch them
                    const productDetails = await Promise.all(
                        guestCart.map(async (item) => {
                            try {
                                const product = await apiService.get(`/products/${item.id}/`);
                                return { ...item, product };
                            } catch {
                                return { ...item, product: { name: 'Unknown Product', price: 0 } };
                            }
                        })
                    );

                    const formattedCart = {
                        items: productDetails.map((item, index) => ({
                            id: `guest-${index}`,
                            product: item.product,
                            product_name: item.product.name,
                            product_image: item.product.image,
                            quantity: item.quantity,
                            price: item.product.discounted_price || item.product.price,
                            total: (item.product.discounted_price || item.product.price) * item.quantity
                        })),
                        total_price: productDetails.reduce((sum, item) =>
                            sum + ((item.product.discounted_price || item.product.price) * item.quantity), 0
                        ).toFixed(2),
                        total_items: productDetails.reduce((sum, item) => sum + item.quantity, 0),
                        isGuestCart: true
                    };
                    setCart(formattedCart);
                } else {
                    setCart(null);
                }
                setLoading(false);
                return;
            }

            // Logged in user - use API (original flow)
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
            await removeItem(itemId);
            return;
        }

        // Handle guest cart
        if (typeof itemId === 'string' && itemId.startsWith('guest-')) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const index = parseInt(itemId.replace('guest-', ''));
            if (guestCart[index]) {
                guestCart[index].quantity = newQty;
                localStorage.setItem('guestCart', JSON.stringify(guestCart));
                await loadCart();
            }
            return;
        }

        // Logged in user - use API (original flow)
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

    const removeItem = async (itemId) => {
        // Handle guest cart
        if (typeof itemId === 'string' && itemId.startsWith('guest-')) {
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            const index = parseInt(itemId.replace('guest-', ''));
            guestCart.splice(index, 1);
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            showToast('Item removed', 'success');
            await loadCart();
            return;
        }

        // Logged in user - use API (original flow)
        try {
            const result = await apiService.deleteCartItem(itemId);
            setCart(result);
            showToast('Item removed', 'success');
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Could not remove item', 'error');
        }
    };

    const goToCheckout = () => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        navigate("/checkout");
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
                                {/* Product Image */}
                                <div style={styles.itemImage}>
                                    {item.product_image || item.image ? (
                                        <img
                                            src={item.product_image || item.image}
                                            alt={item.product_name || item.name}
                                            style={styles.thumbnail}
                                        />
                                    ) : (
                                        <div style={styles.placeholderImage}>
                                            🏃
                                        </div>
                                    )}
                                </div>

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

                    <button style={styles.checkoutButton} onClick={goToCheckout}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>

            {/* Login Required Modal */}
            {showLoginModal && (
                <div style={styles.loginModalOverlay} onClick={() => setShowLoginModal(false)}>
                    <div style={styles.loginModal} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalIcon}>🔐</div>
                        <h2 style={styles.modalTitle}>Sign In Required</h2>
                        <p style={styles.modalText}>Please sign in to proceed with checkout and complete your purchase.</p>
                        <div style={styles.modalButtons}>
                            <button style={styles.modalButtonSecondary} onClick={() => { setShowLoginModal(false); navigate("/"); }}>Continue Shopping</button>
                            <Link to="/login" style={styles.modalButtonPrimary}>Sign In</Link>
                        </div>
                    </div>
                </div>
            )}
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
        gap: "16px",
    },
    itemImage: {
        width: "80px",
        height: "80px",
        flexShrink: 0,
    },
    thumbnail: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "8px",
    },
    placeholderImage: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3F4F6",
        borderRadius: "8px",
        fontSize: "32px",
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
    loginModalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
    loginModal: { backgroundColor: "#FFFFFF", borderRadius: "24px", padding: "40px", maxWidth: "420px", width: "90%", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
    modalIcon: { fontSize: "64px", marginBottom: "20px" },
    modalTitle: { fontSize: "24px", fontWeight: "700", color: "#1E293B", margin: "0 0 12px 0" },
    modalText: { fontSize: "16px", color: "#64748B", margin: "0 0 32px 0", lineHeight: "1.6" },
    modalButtons: { display: "flex", gap: "16px" },
    modalButtonPrimary: { flex: 1, padding: "16px", backgroundColor: "#FF7A00", color: "#FFFFFF", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" },
    modalButtonSecondary: { flex: 1, padding: "16px", backgroundColor: "transparent", color: "#64748B", border: "2px solid #E2E8F0", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer" },
};

export default CartPage;
