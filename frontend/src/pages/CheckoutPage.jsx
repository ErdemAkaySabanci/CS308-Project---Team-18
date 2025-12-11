import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiService } from "../services/apiService";
import { cartService } from "../services/cartService";

function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Payment, 3: Summary

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // Store order response with invoice

  const navigate = useNavigate();

  useEffect(() => {
    loadPage();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      const userInfo = await apiService.get("/users/me/");
      setUser(userInfo);
      setAddressInput(userInfo.home_address || "");
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (err) {
      console.error(err);
      setError("Failed to load checkout page.");
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async () => {
    if (!addressInput.trim()) {
      showToast("Please enter your delivery address.", "error");
      return;
    }

    try {
      setSavingAddress(true);
      await apiService.updateAddress(addressInput);
      setUser({ ...user, home_address: addressInput });
      showToast("Address saved successfully! ✓", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to save address. Please try again.", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const goToPayment = () => {
    if (!user.home_address || user.home_address.trim() === "") {
      showToast("Please add and save your address first.", "error");
      return;
    }
    setCurrentStep(2);
  };

  const processPayment = async () => {
    // Validate payment data
    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      showToast("Please enter a valid 16-digit card number.", "error");
      return;
    }
    if (!paymentData.cardName.trim()) {
      showToast("Please enter cardholder name.", "error");
      return;
    }
    if (!paymentData.expiry.match(/^\d{2}\/\d{2}$/)) {
      showToast("Please enter expiry in MM/YY format.", "error");
      return;
    }

    // Validate month (01-12) and year (>= 25)
    const [monthStr, yearStr] = paymentData.expiry.split('/');
    const month = parseInt(monthStr);
    const year = parseInt(yearStr);

    if (month < 1 || month > 12 || year < 25) {
      showToast("Please enter valid card date.", "error");
      return;
    }

    if (!paymentData.cvv || paymentData.cvv.length !== 3) {
      showToast("Please enter a valid 3-digit CVV.", "error");
      return;
    }

    // Mock payment processing
    try {
      setProcessingPayment(true);

      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      showToast("Payment successful! ✓", "success");
      setCurrentStep(3);
    } catch (err) {
      showToast("Payment failed. Please try again.", "error");
    } finally {
      setProcessingPayment(false);
    }
  };

  const placeOrder = async () => {
    try {
      // Include payment info in checkout
      const checkoutData = {
        payment: {
          card_number: paymentData.cardNumber.replace(/\s/g, ''),
          card_name: paymentData.cardName,
          expiry: paymentData.expiry,
          cvv: paymentData.cvv
        }
      };

      const response = await apiService.post("/orders/checkout/", checkoutData);
      setOrderResult(response);
      showToast("Order created successfully! 🎉", "success");
      setCurrentStep(4); // Go to invoice display
    } catch (err) {
      console.error(err);
      showToast("Checkout failed. Please try again.", "error");
    }
  };

  const downloadInvoice = async () => {
    if (!orderResult) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000${orderResult.invoice_url}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderResult.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast("Invoice downloaded! 📥", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to download invoice.", "error");
    }
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (error) return <div style={styles.center}>{error}</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div style={styles.center}>
        <span style={{ fontSize: '64px', marginBottom: '20px' }}>🛒</span>
        <h2>Your cart is empty.</h2>
        <Link to="/" style={styles.shopLink}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Toast Notification */}
      {toast.show && (
        <div style={{
          ...styles.toast,
          backgroundColor: toast.type === 'success' ? '#10B981' : '#EF4444'
        }}>
          <span style={styles.toastIcon}>
            {toast.type === 'success' ? '✓' : '✕'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      <div style={styles.page}>
        <h1 style={styles.title}>🛒 Checkout</h1>

        {/* STEP INDICATOR */}
        <div style={styles.stepIndicator}>
          <div style={currentStep >= 1 ? styles.stepActive : styles.step}>
            <span style={styles.stepNumber}>1</span>
            <span style={styles.stepLabel}>Address</span>
          </div>
          <div style={styles.stepLine}></div>
          <div style={currentStep >= 2 ? styles.stepActive : styles.step}>
            <span style={styles.stepNumber}>2</span>
            <span style={styles.stepLabel}>Payment</span>
          </div>
          <div style={styles.stepLine}></div>
          <div style={currentStep >= 3 ? styles.stepActive : styles.step}>
            <span style={styles.stepNumber}>3</span>
            <span style={styles.stepLabel}>Confirm</span>
          </div>
          <div style={styles.stepLine}></div>
          <div style={currentStep >= 4 ? styles.stepActive : styles.step}>
            <span style={styles.stepNumber}>4</span>
            <span style={styles.stepLabel}>Invoice</span>
          </div>
        </div>

        {/* STEP 1: ADDRESS */}
        {currentStep === 1 && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>📍 Delivery Address</h2>

              <div style={styles.addressBox}>
                <textarea
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="Enter your full delivery address..."
                  style={styles.textarea}
                  rows={3}
                />
                <button
                  onClick={saveAddress}
                  style={{
                    ...styles.saveButton,
                    opacity: savingAddress ? 0.7 : 1
                  }}
                  disabled={savingAddress}
                >
                  {savingAddress ? "Saving..." : "💾 Save Address"}
                </button>

                {user.home_address && (
                  <p style={styles.savedText}>✅ Address saved</p>
                )}
              </div>
            </div>

            <button
              style={{
                ...styles.continueButton,
                opacity: user.home_address ? 1 : 0.5,
                cursor: user.home_address ? "pointer" : "not-allowed"
              }}
              onClick={goToPayment}
              disabled={!user.home_address}
            >
              Continue to Payment →
            </button>

            {!user.home_address && (
              <p style={styles.warningText}>⚠️ Please save your address first</p>
            )}
          </>
        )}

        {/* STEP 2: PAYMENT */}
        {currentStep === 2 && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>💳 Payment Information</h2>

              <div style={styles.paymentForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                      const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                      setPaymentData({ ...paymentData, cardNumber: formatted });
                    }}
                    maxLength={19}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={paymentData.cardName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={paymentData.expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');

                        // Limit month to 12
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }

                        setPaymentData({ ...paymentData, expiry: value });
                      }}
                      maxLength={5}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ ...styles.formGroup, flex: 1 }}>
                    <label style={styles.label}>CVV</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={paymentData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPaymentData({ ...paymentData, cvv: value });
                      }}
                      maxLength={3}
                      style={styles.input}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button
                style={styles.backButton}
                onClick={() => setCurrentStep(1)}
              >
                ← Back
              </button>
              <button
                style={{
                  ...styles.continueButton,
                  opacity: processingPayment ? 0.7 : 1
                }}
                onClick={processPayment}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : "Confirm Payment →"}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: ORDER SUMMARY */}
        {currentStep === 3 && (
          <>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>📦 Order Summary</h2>

              {cart.items.map((item) => (
                <div key={item.id} style={styles.summaryRow}>
                  <span>{item.product_name || item.name} (x{item.quantity})</span>
                  <span style={styles.itemPrice}>{item.subtotal} TL</span>
                </div>
              ))}

              <hr style={styles.divider} />

              <div style={styles.totalRow}>
                <span>Total</span>
                <span style={styles.totalPrice}>{cart.total_price} TL</span>
              </div>

              <div style={styles.infoBox}>
                <p><strong>Delivery Address:</strong> {user.home_address}</p>
                <p><strong>Payment Method:</strong> Card ending in {paymentData.cardNumber.slice(-4)}</p>
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button
                style={styles.backButton}
                onClick={() => setCurrentStep(2)}
              >
                ← Back
              </button>
              <button
                style={styles.checkoutButton}
                onClick={placeOrder}
              >
                🛒 Place Order
              </button>
            </div>
          </>
        )}

        {/* STEP 4: INVOICE */}
        {currentStep === 4 && orderResult && (
          <>
            <div style={styles.successCard}>
              <div style={styles.successIcon}>✓</div>
              <h2 style={styles.successTitle}>Order Placed Successfully!</h2>
              <p style={styles.successMessage}>
                Your order has been confirmed and an invoice has been emailed to you.
              </p>
            </div>

            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>📄 Invoice Details</h2>

              <div style={styles.invoiceGrid}>
                <div style={styles.invoiceItem}>
                  <span style={styles.invoiceLabel}>Invoice Number:</span>
                  <span style={styles.invoiceValue}>{orderResult.invoice_number}</span>
                </div>

                <div style={styles.invoiceItem}>
                  <span style={styles.invoiceLabel}>Order ID:</span>
                  <span style={styles.invoiceValue}>#{orderResult.order_id}</span>
                </div>

                <div style={styles.invoiceItem}>
                  <span style={styles.invoiceLabel}>Total Amount:</span>
                  <span style={styles.invoiceValue}>{cart.total_price} TL</span>
                </div>

                <div style={styles.invoiceItem}>
                  <span style={styles.invoiceLabel}>Payment:</span>
                  <span style={styles.invoiceValue}>Card ending in {paymentData.cardNumber.slice(-4)}</span>
                </div>
              </div>

              <div style={styles.invoiceActions}>
                <button
                  onClick={downloadInvoice}
                  style={styles.downloadButton}
                >
                  📥 Download Invoice PDF
                </button>

                <button
                  style={styles.viewOrdersButton}
                  onClick={() => navigate('/orders')}
                >
                  📋 View Order History
                </button>
              </div>
            </div>
          </>
        )}

        <Link to="/cart" style={styles.backLink}>
          ← Back to Cart
        </Link>
      </div>
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  page: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 24px",
  },
  title: {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "28px",
    color: '#1E293B',
  },
  card: {
    background: "#FFFFFF",
    padding: "28px",
    borderRadius: "16px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "20px",
    color: '#1E293B',
  },
  addressBox: {
    background: "#F8FAFC",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    marginBottom: "14px",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
  },
  saveButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
    transition: "all 0.2s ease",
  },
  savedText: {
    color: "#059669",
    marginTop: "12px",
    fontSize: "14px",
    fontWeight: 500,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    fontSize: "16px",
    color: '#475569',
    borderBottom: '1px solid #F1F5F9',
  },
  itemPrice: {
    fontWeight: 600,
    color: '#1E293B',
  },
  divider: {
    margin: "20px 0",
    border: "none",
    borderTop: "2px solid #F1F5F9",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    fontSize: "20px",
    fontWeight: 700,
    color: '#1E293B',
  },
  totalPrice: {
    color: '#F97316',
    fontSize: '24px',
  },
  checkoutButton: {
    marginTop: "24px",
    width: "100%",
    padding: "18px",
    background: "linear-gradient(135deg, #3B82F6 0%, #1E3A8A 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "17px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    transition: "all 0.2s ease",
  },
  warningText: {
    color: "#EF4444",
    textAlign: "center",
    marginTop: "14px",
    fontSize: "14px",
    fontWeight: 500,
  },
  center: {
    textAlign: "center",
    marginTop: "15vh",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #E2E8F0',
    borderTopColor: '#F97316',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  shopLink: {
    display: 'inline-block',
    padding: "14px 28px",
    background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    color: "#FFFFFF",
    borderRadius: "12px",
    textDecoration: "none",
    fontWeight: 700,
    fontSize: '16px',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    color: '#3B82F6',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '15px',
    marginTop: '8px',
  },

  // Toast
  toast: {
    position: "fixed",
    top: "100px",
    right: "24px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 24px",
    borderRadius: "12px",
    color: "#FFFFFF",
    fontWeight: 600,
    boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
    zIndex: 9999,
    animation: "slideIn 0.3s ease",
  },
  toastIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    fontWeight: "bold",
  },

  // Step Indicator
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "40px",
    padding: "20px",
  },
  step: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    opacity: 0.4,
  },
  stepActive: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    opacity: 1,
  },
  stepNumber: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#3B82F6",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
  },
  stepLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748B",
  },
  stepLine: {
    width: "80px",
    height: "2px",
    backgroundColor: "#E2E8F0",
    margin: "0 16px",
  },

  // Payment Form
  paymentForm: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formRow: {
    display: "flex",
    gap: "16px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "14px",
    fontSize: "15px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    fontFamily: "inherit",
    transition: "border-color 0.2s ease",
    outline: "none",
  },

  // Buttons
  continueButton: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    transition: "all 0.2s ease",
    marginTop: "16px",
  },
  buttonRow: {
    display: "flex",
    gap: "16px",
    margin: "24px 0",
  },
  backButton: {
    flex: 1,
    padding: "16px",
    background: "#F1F5F9",
    color: "#475569",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  // Info Box
  infoBox: {
    backgroundColor: "#F8FAFC",
    padding: "16px",
    borderRadius: "10px",
    marginTop: "20px",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  // Step 4: Invoice Display
  successCard: {
    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    marginBottom: "24px",
    boxShadow: "0 10px 40px rgba(16, 185, 129, 0.3)",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "48px",
    color: "#fff",
    fontWeight: "bold",
  },
  successTitle: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "12px",
  },
  successMessage: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "16px",
    lineHeight: "1.6",
  },
  invoiceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "24px",
  },
  invoiceItem: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  invoiceLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  invoiceValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1E293B",
  },
  invoiceActions: {
    display: "flex",
    gap: "16px",
    marginTop: "32px",
  },
  downloadButton: {
    flex: 1,
    padding: "16px",
    background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    textAlign: "center",
    boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
    transition: "all 0.2s ease",
  },
  viewOrdersButton: {
    flex: 1,
    padding: "16px",
    background: "#F1F5F9",
    color: "#475569",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

// Add animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(styleSheet);

export default CheckoutPage;
