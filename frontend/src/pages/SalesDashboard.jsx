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

    // Invoice state
    const [invoices, setInvoices] = useState([]);
    const [invoiceStartDate, setInvoiceStartDate] = useState('2024-01-01');
    const [invoiceEndDate, setInvoiceEndDate] = useState('2025-12-31');
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [invoiceError, setInvoiceError] = useState(null);

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
                        <h2>Apply Discount to Products</h2>
                        <p className="section-description">
                            Set discounts on products and automatically notify users who have them in their wishlist.
                        </p>

                        <form onSubmit={handleApplyDiscount} className="discount-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Product IDs (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={discountProductIds}
                                        onChange={(e) => setDiscountProductIds(e.target.value)}
                                        placeholder="e.g., 1, 2, 3, 4"
                                        className="form-input"
                                    />
                                    <small className="form-hint">Enter product IDs separated by commas</small>
                                </div>

                                <div className="form-group">
                                    <label>Discount Percentage</label>
                                    <div className="input-with-suffix">
                                        <input
                                            type="number"
                                            value={discountPercentage}
                                            onChange={(e) => setDiscountPercentage(e.target.value)}
                                            placeholder="20"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            className="form-input"
                                        />
                                        <span className="input-suffix">%</span>
                                    </div>
                                    <small className="form-hint">Discount rate (0-100%)</small>
                                </div>
                            </div>

                            <button type="submit" className="submit-btn">
                                <span>🏷️</span>
                                Apply Discount & Notify Wishlist Users
                            </button>
                        </form>

                        <div className="info-box">
                            <div className="info-icon">ℹ️</div>
                            <div className="info-content">
                                <h4>How it works:</h4>
                                <ul>
                                    <li>Enter the IDs of products you want to discount</li>
                                    <li>Set the discount percentage</li>
                                    <li>Users who have these products in their wishlist will be notified</li>
                                    <li>Discounted prices will be automatically calculated and displayed</li>
                                </ul>
                            </div>
                        </div>
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
        </div>
    );
};

export default SalesDashboard;
