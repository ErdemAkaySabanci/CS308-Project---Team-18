import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const isAuthenticated = authService.isAuthenticated();

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
                    SportStore
                </NavLink>

                {/* Desktop Menu */}
                <div style={styles.desktopMenu} className="desktop-menu">
                    <NavLink
                        to="/"
                        style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                        end
                    >
                        Home
                    </NavLink>

                   

                    <NavLink
                        to="/cart"
                        style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                    >
                        Cart
                    </NavLink>

                    {/* ⭐️ My Orders Added */}
                    <NavLink
                        to="/orders"
                        style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                    >
                        My Orders
                    </NavLink>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Logout
                        </button>
                    ) : (
                        <div style={styles.authLinks}>
                            <NavLink
                                to="/login"
                                style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
                            >
                                Login
                            </NavLink>
                            <NavLink to="/register" style={styles.registerButton}>
                                Register
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
                    <span style={styles.hamburgerIcon}>☰</span>
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div style={styles.mobileMenu}>
                    <NavLink
                        to="/"
                        style={({ isActive }) =>
                            isActive ? styles.mobileActiveLink : styles.mobileLink
                        }
                        onClick={closeMobileMenu}
                        end
                    >
                        Home
                    </NavLink>

                   

                    <NavLink
                        to="/cart"
                        style={({ isActive }) =>
                            isActive ? styles.mobileActiveLink : styles.mobileLink
                        }
                        onClick={closeMobileMenu}
                    >
                        Cart
                    </NavLink>

                    {/* ⭐️ Mobile My Orders */}
                    <NavLink
                        to="/orders"
                        style={({ isActive }) =>
                            isActive ? styles.mobileActiveLink : styles.mobileLink
                        }
                        onClick={closeMobileMenu}
                    >
                        My Orders
                    </NavLink>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} style={styles.mobileLogoutButton}>
                            Logout
                        </button>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                style={({ isActive }) =>
                                    isActive ? styles.mobileActiveLink : styles.mobileLink
                                }
                                onClick={closeMobileMenu}
                            >
                                Login
                            </NavLink>

                            <NavLink
                                to="/register"
                                style={styles.mobileRegisterButton}
                                onClick={closeMobileMenu}
                            >
                                Register
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logo: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#2D5FFF',
        textDecoration: 'none',
    },
    desktopMenu: {
        display: 'flex',
        alignItems: 'center',
        gap: '32px',
    },
    link: {
        textDecoration: 'none',
        color: '#667085',
        fontWeight: '500',
        fontSize: '16px',
    },
    activeLink: {
        textDecoration: 'none',
        color: '#2D5FFF',
        fontWeight: '600',
        fontSize: '16px',
    },
    authLinks: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    registerButton: {
        textDecoration: 'none',
        backgroundColor: '#2D5FFF',
        color: '#FFFFFF',
        padding: '10px 20px',
        borderRadius: '8px',
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: 'transparent',
        border: '1px solid #D0D5DD',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600',
        color: '#344054',
    },
    mobileMenuButton: {
        display: 'none',
        background: 'none',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        color: '#1A1A1A',
    },
    hamburgerIcon: {
        fontSize: '24px',
    },
    mobileMenu: {
        position: 'absolute',
        top: '70px',
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #EAECF0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    mobileLink: {
        textDecoration: 'none',
        color: '#667085',
        fontSize: '18px',
        fontWeight: '500',
    },
    mobileActiveLink: {
        textDecoration: 'none',
        color: '#2D5FFF',
        fontSize: '18px',
        fontWeight: '600',
    },
    mobileRegisterButton: {
        textDecoration: 'none',
        backgroundColor: '#2D5FFF',
        color: '#FFFFFF',
        padding: '12px',
        borderRadius: '8px',
        fontWeight: '600',
        textAlign: 'center',
    },
    mobileLogoutButton: {
        backgroundColor: '#F2F4F7',
        border: 'none',
        padding: '12px',
        borderRadius: '8px',
        fontWeight: '600',
        color: '#344054',
        cursor: 'pointer',
        textAlign: 'center',
    },
};

// Media Queries Injection
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @media (max-width: 768px) {
    .desktop-menu { display: none !important; }
    .mobile-menu-button { display: block !important; }
  }
  @media (min-width: 769px) {
    .desktop-menu { display: flex !important; }
    .mobile-menu-button { display: none !important; }
  }
`;
document.head.appendChild(styleSheet);

export default Navbar;
