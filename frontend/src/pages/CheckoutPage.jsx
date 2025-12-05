import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { authService } from '../services/authService';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = authService.getToken();
            const response = await fetch('http://127.0.0.1:8000/api/orders/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ delivery_address: address })
            });

            const data = await response.json();

            if (response.ok) {
                // Order created successfully
                // Clear cart locally if needed, but backend clears it.
                // We might need to notify cartService to refresh or clear its cache if it has one.
                // Assuming cartService re-fetches.
                navigate('/orders');
            } else {
                setError(data.error || 'Failed to place order.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setError('An error occurred during checkout.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Checkout</h1>

            <div style={styles.card}>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Delivery Address</label>
                        <textarea
                            required
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={styles.textarea}
                            placeholder="Enter your full delivery address..."
                            rows={4}
                        />
                    </div>

                    {error && <div style={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? 'Processing Order...' : 'Place Order'}
                    </button>

                    <p style={styles.note}>
                        By placing this order, stock will be reserved and the order will be sent to the delivery department.
                    </p>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '600px',
        margin: '40px auto',
        padding: '0 20px',
        fontFamily: "'Inter', sans-serif",
    },
    title: {
        fontSize: '32px',
        fontWeight: '700',
        marginBottom: '24px',
        color: '#1A1A1A',
        textAlign: 'center'
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        border: '1px solid #E4E7EC',
    },
    formGroup: {
        marginBottom: '24px',
    },
    label: {
        display: 'block',
        fontSize: '16px',
        fontWeight: '600',
        color: '#344054',
        marginBottom: '8px',
    },
    textarea: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #D0D5DD',
        fontSize: '16px',
        fontFamily: 'inherit',
        resize: 'vertical',
        minHeight: '100px',
    },
    button: {
        width: '100%',
        padding: '16px',
        backgroundColor: '#2D5FFF',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    error: {
        color: '#F04438',
        marginBottom: '16px',
        textAlign: 'center',
    },
    note: {
        marginTop: '16px',
        fontSize: '14px',
        color: '#667085',
        textAlign: 'center',
    }
};

export default CheckoutPage;
