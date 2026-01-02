import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import './SalesDashboard.css';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const SalesDashboard = () => {
    // State management
    const [activeTab, setActiveTab] = useState('revenue'); // 'revenue', 'discount', 'invoices'
    const [startDate, setStartDate] = useState('2024-01-01');
    const [endDate, setEndDate] = useState('2025-12-31');
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Discount form state
    const [discountProductIds, setDiscountProductIds] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');

    // Product selection state for visual discount management
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [discountLoading, setDiscountLoading] = useState(false);

    // Invoice state
    const [invoices, setInvoices] = useState([]);
    const [invoiceStartDate, setInvoiceStartDate] = useState('2024-01-01');
    const [invoiceEndDate, setInvoiceEndDate] = useState('2025-12-31');
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    const [invoiceError, setInvoiceError] = useState(null);

    // Refunds state
    const [refunds, setRefunds] = useState([]);
    const [refundsLoading, setRefundsLoading] = useState(false);

    // Fetch all products for discount management
    useEffect(() => {
        if (activeTab === 'discount') {
            fetchProducts();
        }
        if (activeTab === 'refunds') {
            fetchRefunds();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/products/');
            const data = await response.json();
            // Handle both {results: [...]} and direct array formats
            const productList = Array.isArray(data) ? data : (data.results || []);
            setProducts(productList);
        } catch (err) {
            console.error('Error fetching products:', err);
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    // Toggle product selection
    const toggleProductSelection = (productId) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Select/Deselect all
    const selectAll = () => setSelectedProducts(products.map(p => p.id));
    const deselectAll = () => setSelectedProducts([]);

    // Apply discount to selected products
    const applyDiscountToSelected = async () => {
        if (selectedProducts.length === 0) {
            alert('Please select at least one product');
            return;
        }
        if (!discountPercentage || discountPercentage <= 0) {
            alert('Please enter a valid discount percentage');
            return;
        }

        setDiscountLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/apply-discount/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_ids: selectedProducts,
                    discount_percentage: parseFloat(discountPercentage)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to apply discount');
            }

            const result = await response.json();
            alert(`✅ ${result.message || 'Discount applied successfully!'}`);
            setSelectedProducts([]);
            setDiscountPercentage('');
            fetchProducts(); // Refresh products
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            setDiscountLoading(false);
        }
    };

    // Remove discount from selected products
    const removeDiscountFromSelected = async () => {
        if (selectedProducts.length === 0) {
            alert('Please select at least one product');
            return;
        }

        setDiscountLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/apply-discount/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_ids: selectedProducts,
                    discount_percentage: 0
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to remove discount');
            }

            alert('✅ Discount removed successfully!');
            setSelectedProducts([]);
            fetchProducts(); // Refresh products
        } catch (err) {
            alert('❌ Error: ' + err.message);
        } finally {
            setDiscountLoading(false);
        }
    };

    // Fetch revenue report
    const fetchRevenueReport = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/orders/revenue-report/?start_date=${startDate}&end_date=${endDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch revenue report');
            }

            const data = await response.json();
            setRevenueData(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching revenue:', err);
        } finally {
            setLoading(false);
        }
    };

    // Apply discount
    const handleApplyDiscount = async (e) => {
        e.preventDefault();

        if (!discountProductIds.trim() || !discountPercentage) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const productIds = discountProductIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

            if (productIds.length === 0) {
                alert('Please enter valid product IDs');
                return;
            }

            const response = await fetch('http://localhost:8000/api/products/apply-discount/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    product_ids: productIds,
                    discount_percentage: parseFloat(discountPercentage)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to apply discount');
            }

            const result = await response.json();
            alert(`✅ ${result.message || 'Discount applied successfully!'}\nWishlist users have been notified.`);
            setDiscountProductIds('');
            setDiscountPercentage('');
        } catch (err) {
            alert('❌ Error: ' + err.message);
            console.error('Error:', err);
        }
    };

    // Fetch invoices
    const fetchInvoices = async () => {
        setInvoiceLoading(true);
        setInvoiceError(null);

        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(
                `http://localhost:8000/api/orders/invoices/?start_date=${invoiceStartDate}&end_date=${invoiceEndDate}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch invoices');
            }

            const data = await response.json();
            setInvoices(data.invoices || []);
        } catch (err) {
            setInvoiceError(err.message);
            console.error('Error fetching invoices:', err);
        } finally {
            setInvoiceLoading(false);
        }
    };

    // Print invoice (Open PDF in new tab with blob and trigger print)
    const handlePrintInvoice = async (invoiceUrl, invoiceNumber) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000${invoiceUrl}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load invoice for printing');
            }

            // Convert to blob and create URL
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // Open in new tab
            const printWindow = window.open(url, '_blank');

            // Trigger print dialog when loaded
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (err) {
            alert('Error printing invoice: ' + err.message);
            console.error('Print error:', err);
        }
    };

    // Download PDF (Secure with JWT)
    const handleDownloadPDF = async (invoiceUrl, invoiceNumber) => {
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000${invoiceUrl}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to download invoice');
            }

            // Convert response to blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `invoice_${invoiceNumber}.pdf`;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Error downloading PDF: ' + err.message);
            console.error('Download error:', err);
        }
    };

    // Refund Management
    const fetchRefunds = async () => {
        setRefundsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:8000/api/orders/refunds/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRefunds(data);
            }
        } catch (err) {
            console.error('Error fetching refunds:', err);
        } finally {
            setRefundsLoading(false);
        }
    };

    const handleApproveRefund = async (refundId) => {
        if (!window.confirm('Approve this refund? Stock will be restored.')) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/orders/refund/${refundId}/process/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'approve' })
            });
            if (response.ok) {
                alert('✅ Refund approved!');
                fetchRefunds();
            } else {
                const err = await response.json();
                alert('Error: ' + err.error);
            }
        } catch (err) {
            alert('Error processing refund');
        }
    };

    const handleRejectRefund = async (refundId) => {
        if (!window.confirm('Reject this refund?')) return;
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch(`http://localhost:8000/api/orders/refund/${refundId}/process/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'reject' })
            });
            if (response.ok) {
                alert('Refund rejected.');
                fetchRefunds();
            } else {
                const err = await response.json();
                alert('Error: ' + err.error);
            }
        } catch (err) {
            alert('Error processing refund');
        }
    };

    // Chart configurations
    const revenueChartData = revenueData ? {
        labels: ['Revenue', 'Cost', 'Profit/Loss'],
        datasets: [{
            label: 'Amount (TL)',
            data: [
                revenueData.total_revenue,
                revenueData.total_cost,
                Math.abs(revenueData.profit)
            ],
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                revenueData.profit >= 0 ? 'rgba(54, 162, 235, 0.6)' : 'rgba(255, 99, 132, 0.6)'
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 206, 86, 1)',
                revenueData.profit >= 0 ? 'rgba(54, 162, 235, 1)' : 'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 2
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'Financial Overview',
                font: {
                    size: 18,
                    weight: 'bold'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString() + ' TL';
                    }
                }
            }
        },
        // Bar kalınlığı ayarları
        datasets: {
            bar: {
                barThickness: 80,  // Bar kalınlığı (px)
                maxBarThickness: 100,
                categoryPercentage: 0.6,  // Kategori genişliği
                barPercentage: 0.7  // Bar genişliği
            }
        }
    };

    return (
        <div className="sales-dashboard-container">
            <div className="dashboard-header">
                <h1>📊 Sales Manager Dashboard</h1>
                <p className="subtitle">Manage discounts, view revenue reports, and track financial performance</p>
            </div>

            {/* Tab Navigation */}
            <div className="tab-navigation">
                <button
                    className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
                    onClick={() => setActiveTab('revenue')}
                >
                    💰 Revenue & Profit
                </button>
                <button
                    className={`tab-btn ${activeTab === 'discount' ? 'active' : ''}`}
                    onClick={() => setActiveTab('discount')}
                >
                    🏷️ Discount Management
                </button>
                <button
                    className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
                    onClick={() => setActiveTab('invoices')}
                >
                    📄 Invoices
                </button>
                <button
                    className={`tab-btn ${activeTab === 'refunds' ? 'active' : ''}`}
                    onClick={() => setActiveTab('refunds')}
                >
                    🔄 Refund Requests
                </button>
            </div>

            {/* Revenue & Profit Tab */}
            {activeTab === 'revenue' && (
                <div className="tab-content">
                    <div className="revenue-section card">
                        <h2>Revenue & Profit Analysis</h2>

                        <div className="date-filter-container">
                            <div className="date-inputs">
                                <div className="input-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className="generate-btn"
                                onClick={fetchRevenueReport}
                                disabled={loading}
                            >
                                {loading ? '⏳ Loading...' : '📊 Generate Report'}
                            </button>
                        </div>

                        {error && (
                            <div className="error-alert">
                                <span>⚠️</span>
                                <p>{error}</p>
                            </div>
                        )}

                        {revenueData && (
                            <>
                                {/* Stats Cards */}
                                <div className="stats-grid">
                                    <div className="stat-card blue">
                                        <div className="stat-icon">📦</div>
                                        <div className="stat-content">
                                            <p className="stat-label">Total Orders</p>
                                            <p className="stat-value">{revenueData.order_count}</p>
                                        </div>
                                    </div>

                                    <div className="stat-card green">
                                        <div className="stat-icon">💵</div>
                                        <div className="stat-content">
                                            <p className="stat-label">Total Revenue</p>
                                            <p className="stat-value">{revenueData.total_revenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                        </div>
                                    </div>

                                    <div className="stat-card orange">
                                        <div className="stat-icon">💸</div>
                                        <div className="stat-content">
                                            <p className="stat-label">Total Cost</p>
                                            <p className="stat-value">{revenueData.total_cost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                        </div>
                                    </div>

                                    <div className={`stat-card ${revenueData.profit >= 0 ? 'profit' : 'loss'}`}>
                                        <div className="stat-icon">{revenueData.profit >= 0 ? '📈' : '📉'}</div>
                                        <div className="stat-content">
                                            <p className="stat-label">{revenueData.profit >= 0 ? 'Profit' : 'Loss'}</p>
                                            <p className="stat-value">{Math.abs(revenueData.profit).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                        </div>
                                    </div>

                                    <div className="stat-card purple">
                                        <div className="stat-icon">📊</div>
                                        <div className="stat-content">
                                            <p className="stat-label">Profit Margin</p>
                                            <p className="stat-value">{revenueData.profit_margin_percentage.toFixed(2)}%</p>
                                        </div>
                                    </div>

                                    <div className={`stat-card ${revenueData.status === 'profit' ? 'success' : 'danger'}`}>
                                        <div className="stat-icon">{revenueData.status === 'profit' ? '✅' : '❌'}</div>
                                        <div className="stat-content">
                                            <p className="stat-label">Status</p>
                                            <p className="stat-value">{revenueData.status === 'profit' ? 'Profitable' : 'Loss'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart */}
                                {revenueChartData && (
                                    <div className="chart-section">
                                        <div className="chart-wrapper">
                                            <Bar data={revenueChartData} options={chartOptions} />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Discount Management Tab */}
            {activeTab === 'discount' && (
                <div className="tab-content">
                    <div className="discount-section card">
                        <h2>🏷️ Discount Management</h2>
                        <p className="section-description">
                            Select products and apply or remove discounts. Changes will be reflected on the store immediately.
                        </p>

                        {/* Action Bar */}
                        <div className="discount-action-bar">
                            <div className="selection-controls">
                                <button className="select-btn" onClick={selectAll}>
                                    ☑️ Select All
                                </button>
                                <button className="select-btn" onClick={deselectAll}>
                                    ☐ Deselect All
                                </button>
                                <span className="selected-count">
                                    {selectedProducts.length} product(s) selected
                                </span>
                            </div>

                            <div className="discount-controls">
                                <div className="discount-input-group">
                                    <input
                                        type="number"
                                        value={discountPercentage}
                                        onChange={(e) => setDiscountPercentage(e.target.value)}
                                        placeholder="20"
                                        min="0"
                                        max="100"
                                        className="discount-input"
                                    />
                                    <span className="input-label">%</span>
                                </div>
                                <button
                                    className="apply-btn"
                                    onClick={applyDiscountToSelected}
                                    disabled={discountLoading || selectedProducts.length === 0}
                                >
                                    {discountLoading ? '⏳' : '🏷️'} Apply Discount
                                </button>
                                <button
                                    className="remove-btn"
                                    onClick={removeDiscountFromSelected}
                                    disabled={discountLoading || selectedProducts.length === 0}
                                >
                                    {discountLoading ? '⏳' : '❌'} Remove Discount
                                </button>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {productsLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading products...</p>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {products.map(product => (
                                    <div
                                        key={product.id}
                                        className={`product-card ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                                        onClick={() => toggleProductSelection(product.id)}
                                    >
                                        {/* Checkbox */}
                                        <div className="product-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => { }}
                                                readOnly
                                            />
                                        </div>

                                        {/* Discount Badge */}
                                        {product.discount_rate > 0 && (
                                            <div className="discount-badge">
                                                -{product.discount_rate}%
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <div className="product-image">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} />
                                            ) : (
                                                <div className="no-image">🏃</div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="product-info">
                                            <h4 className="product-name">{product.name}</h4>
                                            <p className="product-category">{product.category_name || 'Uncategorized'}</p>

                                            <div className="product-pricing">
                                                {product.discount_rate > 0 ? (
                                                    <>
                                                        <span className="original-price">
                                                            {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                        </span>
                                                        <span className="discounted-price">
                                                            {(product.price * (1 - product.discount_rate / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="current-price">
                                                        {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                                    </span>
                                                )}
                                            </div>

                                            <p className="product-stock">
                                                Stock: {product.quantity_in_stock}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {products.length === 0 && !productsLoading && (
                            <div className="empty-state">
                                <div className="empty-icon">📦</div>
                                <h3>No Products Found</h3>
                                <p>There are no products in the store.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="tab-content">
                    <div className="invoices-section card">
                        <h2>Invoice Management</h2>
                        <p className="section-description">
                            View, print, and download invoices for a specific date range.
                        </p>

                        <div className="date-filter-container">
                            <div className="date-inputs">
                                <div className="input-group">
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={invoiceStartDate}
                                        onChange={(e) => setInvoiceStartDate(e.target.value)}
                                    />
                                </div>

                                <div className="input-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={invoiceEndDate}
                                        onChange={(e) => setInvoiceEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                className="generate-btn"
                                onClick={fetchInvoices}
                                disabled={invoiceLoading}
                            >
                                {invoiceLoading ? '⏳ Loading...' : '📄 Fetch Invoices'}
                            </button>
                        </div>

                        {invoiceError && (
                            <div className="error-alert">
                                <span>⚠️</span>
                                <p>{invoiceError}</p>
                            </div>
                        )}

                        {invoices.length > 0 && (
                            <div className="invoice-table-container">
                                <div className="invoice-table-header">
                                    <h3>Found {invoices.length} invoice(s)</h3>
                                </div>
                                <div className="invoice-table-wrapper">
                                    <table className="invoice-table">
                                        <thead>
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Customer</th>
                                                <th>Date</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th className="no-print">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id}>
                                                    <td className="invoice-number">{invoice.invoice_number}</td>
                                                    <td>
                                                        <div className="customer-info">
                                                            <strong>{invoice.customer_name}</strong>
                                                            <small>{invoice.customer_email}</small>
                                                        </div>
                                                    </td>
                                                    <td>{new Date(invoice.created_at).toLocaleDateString('tr-TR')}</td>
                                                    <td className="amount">{invoice.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
                                                    <td>
                                                        <span className={`status-badge status-${invoice.status}`}>
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="actions no-print">
                                                        <button
                                                            className="action-btn print-btn"
                                                            onClick={() => handlePrintInvoice(invoice.invoice_url, invoice.invoice_number)}
                                                            title="Print Invoice"
                                                        >
                                                            🖨️
                                                        </button>
                                                        <button
                                                            className="action-btn download-btn"
                                                            onClick={() => handleDownloadPDF(invoice.invoice_url, invoice.invoice_number)}
                                                            title="Download PDF"
                                                        >
                                                            📥
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {invoices.length === 0 && !invoiceLoading && !invoiceError && (
                            <div className="empty-state">
                                <div className="empty-icon">📄</div>
                                <h3>No Invoices Found</h3>
                                <p>Select a date range and click "Fetch Invoices" to view invoices.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Refund Requests Tab */}
            {activeTab === 'refunds' && (
                <div className="tab-content">
                    <div className="card">
                        <h2>🔄 Refund Requests</h2>
                        <div className="refresh-container" style={{ marginBottom: '1rem', textAlign: 'right' }}>
                            <button className="generate-btn" onClick={fetchRefunds}>
                                🔄 Refresh
                            </button>
                        </div>

                        {refundsLoading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading refunds...</p>
                            </div>
                        ) : refunds.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">✓</div>
                                <h3>No Refund Requests</h3>
                                <p>There are no refund requests to process.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="invoice-table"> {/* Reusing invoice table styles */}
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Reason</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refunds.map(refund => (
                                            <tr key={refund.id}>
                                                <td>#{refund.id}</td>
                                                <td>#{refund.order_id}</td>
                                                <td>{refund.customer}</td>
                                                <td>{refund.reason}</td>
                                                <td>{refund.amount} TL</td>
                                                <td>
                                                    <span className={`status-badge status-${refund.status}`}>
                                                        {refund.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(refund.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    {refund.status === 'pending' && (
                                                        <div style={{ display: 'flex', gap: '5px' }}>
                                                            <button
                                                                onClick={() => handleApproveRefund(refund.id)}
                                                                style={{ backgroundColor: '#4caf50', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectRefund(refund.id)}
                                                                style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    {refund.status !== 'pending' && (
                                                        <span>Processed by {refund.processed_by}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesDashboard;
