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

                        <div className="coming-soon">
                            <div className="coming-soon-icon">🚧</div>
                            <h3>Coming Soon</h3>
                            <p>Invoice management feature will be available in the next update.</p>
                            <small>You'll be able to view, filter, print, and export invoices as PDF.</small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SalesDashboard;
