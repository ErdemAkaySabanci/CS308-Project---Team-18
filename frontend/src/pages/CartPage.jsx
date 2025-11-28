import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const data = await cartService.getCart();
            if (data) {
                setCart(data);
            }
        } catch (err) {
            console.error('Error fetching cart:', err);
            setError('Failed to load cart. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;

        try {
            const updatedCart = await cartService.updateItem(itemId, newQuantity);
            if (updatedCart && !updatedCart.error) {
                setCart(updatedCart);
            } else {
                alert(updatedCart.error || 'Failed to update quantity');
            }
        } catch (err) {
            console.error('Update error:', err);
            alert('Failed to update quantity');
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to remove this item?')) return;

        try {
            const updatedCart = await cartService.removeItem(itemId);
            if (updatedCart) {
                setCart(updatedCart);
            }
        } catch (err) {
            console.error('Remove error:', err);
            alert('Failed to remove item');
        }
    };

    if (loading) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.loadingText}>Loading cart...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.centerContainer}>
                <div style={styles.errorText}>{error}</div>
                <button onClick={fetchCart} style={styles.retryButton}>Retry</button>
            </div>
        );
    }

    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div style={styles.centerContainer}>
                <h2 style={styles.emptyTitle}>Your cart is empty</h2>
                <p style={styles.emptySubtitle}>Looks like you haven't added any items yet.</p>
                <Link to="/" style={styles.startShoppingButton}>
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Shopping Cart</h1>

            <div style={styles.content}>
                <div style={styles.itemsList}>
                    {cart.items.map((item) => (
                        <div key={item.id} style={styles.itemCard}>
                            <div style={styles.itemImageContainer}>
                                {/* Placeholder for image if not available in item.product */}
                                <div style={styles.imagePlaceholder}>
                                    {item.product_name ? item.product_name.charAt(0) : 'P'}
                                </div>
                            </div>

                            <div style={styles.itemDetails}>
                                <h3 style={styles.itemName}>{item.product_name}</h3>
                                <p style={styles.itemPrice}>${item.price}</p>
                            </div>

                            <div style={styles.quantityControls}>
                                <button
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                    style={styles.quantityButton}
                                    disabled={item.quantity <= 1}
                                >
                                    -
                                </button>
                                <span style={styles.quantity}>{item.quantity}</span>
                                <button
                                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                    style={styles.quantityButton}
                                >
                                    +
                                </button>
                            </div>

                            <div style={styles.itemTotal}>
                                ${(item.price * item.quantity).toFixed(2)}
                            </div>

                            <button
                                onClick={() => handleRemoveItem(item.id)}
                                style={styles.removeButton}
                                aria-label="Remove item"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>

                <div style={styles.summary}>
                    <h2 style={styles.summaryTitle}>Order Summary</h2>

                    <div style={styles.summaryRow}>
                        <span>Subtotal</span>
                        <span>${cart.total_price}</span>
                    </div>

                    <div style={styles.divider}></div>

                    <div style={styles.summaryRowTotal}>
                        <span>Total</span>
                        <span>${cart.total_price}</span>
                    </div>

                    <button style={styles.checkoutButton}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: "'Inter', sans-serif",
        color: '#1A1A1A',
    },
    centerContainer: {
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '32px',
    },
    content: {
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: '40px',
        alignItems: 'start',
    },
    itemsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    },
    itemCard: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        border: '1px solid #E4E7EC',
    },
    itemImageContainer: {
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        backgroundColor: '#F2F4F7',
        marginRight: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholder: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#98A2B3',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: '18px',
        fontWeight: '600',
        margin: '0 0 8px 0',
    },
    itemPrice: {
        fontSize: '16px',
        color: '#667085',
        margin: 0,
    },
    quantityControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginRight: '32px',
        backgroundColor: '#F9FAFB',
        padding: '4px',
        borderRadius: '8px',
        border: '1px solid #EAECF0',
    },
    quantityButton: {
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        cursor: 'pointer',
        color: '#1A1A1A',
        fontWeight: '600',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    },
    quantity: {
        fontSize: '16px',
        fontWeight: '500',
        minWidth: '20px',
        textAlign: 'center',
    },
    itemTotal: {
        fontSize: '18px',
        fontWeight: '600',
        marginRight: '24px',
        minWidth: '80px',
        textAlign: 'right',
    },
    removeButton: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        color: '#F04438',
        padding: '8px',
        borderRadius: '8px',
        transition: 'background-color 0.2s',
    },
    summary: {
        backgroundColor: '#FFFFFF',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid #E4E7EC',
    },
    summaryTitle: {
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '24px',
        marginTop: 0,
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        color: '#667085',
        fontSize: '16px',
    },
    divider: {
        height: '1px',
        backgroundColor: '#EAECF0',
        margin: '24px 0',
    },
    summaryRowTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '32px',
        fontSize: '20px',
        fontWeight: '700',
        color: '#1A1A1A',
    },
    checkoutButton: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#2D5FFF', // Primary
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        boxShadow: '0 4px 12px rgba(45, 95, 255, 0.2)',
    },
    emptyTitle: {
        fontSize: '24px',
        fontWeight: '700',
        marginBottom: '12px',
    },
    emptySubtitle: {
        fontSize: '16px',
        color: '#667085',
        marginBottom: '32px',
    },
    startShoppingButton: {
        display: 'inline-block',
        padding: '12px 24px',
        backgroundColor: '#2D5FFF',
        color: '#FFFFFF',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: '600',
    },
    loadingText: {
        fontSize: '18px',
        color: '#667085',
    },
    errorText: {
        color: '#F04438',
        marginBottom: '16px',
    },
    retryButton: {
        padding: '8px 16px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D5DD',
        borderRadius: '6px',
        cursor: 'pointer',
    },
};

// Responsive styles would typically be handled with media queries in CSS
// For inline styles, we can't easily do media queries, but the grid layout helps.
// A real implementation would move these to a CSS file or styled-components.

export default CartPage;
