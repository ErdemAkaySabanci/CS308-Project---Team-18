import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = authService.isAuthenticated();

    // Get user role
    const user = isAuthenticated ? JSON.parse(localStorage.getItem('user') || '{}') : null;
    const isSalesManager = user?.role === 'sales_manager';

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav style={styles.navbar}>
            <div style={styles.container}>
                {/* Logo */}
                <NavLink to="/" style={styles.logo} onClick={closeMobileMenu}>
                    <span style={styles.logoIcon}>🏆</span>
                    <span style={styles.logoText}>Sport</span>
                    <span style={styles.logoTextAccent}>Store</span>
                </NavLink>

                {/* Desktop Menu */}
                <div style={styles.desktopMenu} className="desktop-menu">
                    <NavLink
                        to="/"
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : {})
                        })}
                        end
                    >
                        Home
                    </NavLink>

                    <NavLink
                        to="/cart"
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : {})
                        })}
                    >
                        🛒 Cart
                    </NavLink>

                    <NavLink
                        to="/account"
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : {})
                        })}
                    >
                        👤 Account
                    </NavLink>
                    <NavLink
                        to="/orders"
                        style={({ isActive }) => ({
                            ...styles.navLink,
                            ...(isActive ? styles.navLinkActive : {})
                        })}
                    >
                        📦 My Orders
                    </NavLink>

                    {isSalesManager && (
                        <NavLink
                            to="/sales-dashboard"
                            style={({ isActive }) => ({
                                ...styles.navLink,
                                ...(isActive ? styles.navLinkActive : {})
                            })}
                        >
                            📊 Sales Dashboard
                        </NavLink>
                    )}

                    <div style={styles.divider}></div>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Logout
                        </button>
                    ) : (
                        <div style={styles.authButtons}>
                            <NavLink to="/login" style={styles.loginButton}>
                                Sign In
                            </NavLink>
                            <NavLink to="/register" style={styles.registerButton}>
                                Get Started
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    style={styles.mobileMenuButton}
                    className="mobile-menu-button"
                    onClick={toggleMobileMenu}
                >
                    <div style={{
                        ...styles.hamburgerLine,
                        transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'
                    }}></div>
                    <div style={{
                        ...styles.hamburgerLine,
                        opacity: isMobileMenuOpen ? 0 : 1
                    }}></div>
                    <div style={{
                        ...styles.hamburgerLine,
                        transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'
                    }}></div>
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div style={styles.mobileMenu}>
                    <NavLink
                        to="/"
                        style={({ isActive }) => ({
                            ...styles.mobileNavLink,
                            ...(isActive ? styles.mobileNavLinkActive : {})
                        })}
                        onClick={closeMobileMenu}
                        end
                    >
                        🏠 Home
                    </NavLink>

                    <NavLink
                        to="/cart"
                        style={({ isActive }) => ({
                            ...styles.mobileNavLink,
                            ...(isActive ? styles.mobileNavLinkActive : {})
                        })}
                        onClick={closeMobileMenu}
                    >
                        🛒 Cart
                    </NavLink>

                    <NavLink
                        to="/orders"
                        style={({ isActive }) => ({
                            ...styles.mobileNavLink,
                            ...(isActive ? styles.mobileNavLinkActive : {})
                        })}
                        onClick={closeMobileMenu}
                    >
                        📦 My Orders
                    </NavLink>

                    {isSalesManager && (
                        <NavLink
                            to="/sales-dashboard"
                            style={({ isActive }) => ({
                                ...styles.mobileNavLink,
                                ...(isActive ? styles.mobileNavLinkActive : {})
                            })}
                            onClick={closeMobileMenu}
                        >
                            📊 Sales Dashboard
                        </NavLink>
                    )}

                    <div style={styles.mobileDivider}></div>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} style={styles.mobileLogoutButton}>
                            Logout
                        </button>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                style={styles.mobileLoginButton}
                                onClick={closeMobileMenu}
                            >
                                Sign In
                            </NavLink>
                            <NavLink
                                to="/register"
                                style={styles.mobileRegisterButton}
                                onClick={closeMobileMenu}
                            >
                                Get Started
                            </NavLink>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
};

const styles = {
    navbar: {
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        borderBottom: '3px solid #F97316',
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    // Logo
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
    },
    logoIcon: {
        fontSize: '28px',
    },
    logoText: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#1E3A8A',
    },
    logoTextAccent: {
        fontSize: '24px',
        fontWeight: '800',
        color: '#F97316',
    },

    // Desktop Menu
    desktopMenu: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    navLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        textDecoration: 'none',
        color: '#64748B',
        fontWeight: '600',
        fontSize: '15px',
        padding: '10px 18px',
        borderRadius: '10px',
        transition: 'all 0.2s ease',
    },
    navLinkActive: {
        color: '#F97316',
        backgroundColor: '#FFF7ED',
    },
    divider: {
        width: '1px',
        height: '24px',
        backgroundColor: '#E2E8F0',
        margin: '0 8px',
    },

    // Auth Buttons
    authButtons: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    loginButton: {
        textDecoration: 'none',
        color: '#475569',
        fontWeight: '600',
        fontSize: '15px',
        padding: '10px 20px',
        borderRadius: '10px',
        transition: 'all 0.2s ease',
    },
    registerButton: {
        textDecoration: 'none',
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: '15px',
        padding: '12px 24px',
        borderRadius: '10px',
        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
        transition: 'all 0.2s ease',
    },
    logoutButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: '#FEF2F2',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '15px',
        color: '#DC2626',
        transition: 'all 0.2s ease',
    },

    // Mobile Menu Button
    mobileMenuButton: {
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '5px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
    },
    hamburgerLine: {
        width: '24px',
        height: '2px',
        backgroundColor: '#1E293B',
        borderRadius: '2px',
        transition: 'all 0.3s ease',
    },

    // Mobile Menu
    mobileMenu: {
        position: 'absolute',
        top: '70px',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #F1F5F9',
        padding: '16px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    },
    mobileNavLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        color: '#64748B',
        fontSize: '16px',
        fontWeight: '500',
        padding: '14px 16px',
        borderRadius: '12px',
        transition: 'all 0.2s ease',
    },
    mobileNavLinkActive: {
        color: '#F97316',
        backgroundColor: '#FFF7ED',
        fontWeight: '600',
    },
    mobileDivider: {
        height: '1px',
        backgroundColor: '#F1F5F9',
        margin: '8px 0',
    },
    mobileLoginButton: {
        textDecoration: 'none',
        textAlign: 'center',
        color: '#475569',
        fontWeight: '600',
        fontSize: '16px',
        padding: '14px',
        borderRadius: '12px',
        border: '2px solid #E2E8F0',
    },
    mobileRegisterButton: {
        textDecoration: 'none',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: '16px',
        padding: '14px',
        borderRadius: '12px',
    },
    mobileLogoutButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        backgroundColor: '#FEF2F2',
        border: 'none',
        padding: '14px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '16px',
        color: '#DC2626',
    },
};

// Media Queries
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @media (max-width: 768px) {
    .desktop-menu { display: none !important; }
    .mobile-menu-button { display: flex !important; }
  }
  @media (min-width: 769px) {
    .desktop-menu { display: flex !important; }
    .mobile-menu-button { display: none !important; }
  }
  nav a:hover {
    background-color: #FFF7ED !important;
    color: #F97316 !important;
  }
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleSheet);

export default Navbar;
