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
                        style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                        end
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/categories"
                        style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        Categories
                    </NavLink>
                    <NavLink
                        to="/cart"
                        style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                    >
                        Cart
                    </NavLink>

                    {isAuthenticated ? (
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Logout
                        </button>
                    ) : (
                        <div style={styles.authLinks}>
                            <NavLink
                                to="/login"
                                style={({ isActive }) => isActive ? styles.activeLink : styles.link}
                            >
                                Login
                            </NavLink>
                            <NavLink
                                to="/register"
                                style={styles.registerButton}
                            >
                                Register
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button style={styles.mobileMenuButton} className="mobile-menu-button" onClick={toggleMobileMenu}>
                    <span style={styles.hamburgerIcon}>☰</span>
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div style={styles.mobileMenu}>
                    <NavLink
                        to="/"
                        style={({ isActive }) => isActive ? styles.mobileActiveLink : styles.mobileLink}
                        onClick={closeMobileMenu}
                        end
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/categories"
                        style={({ isActive }) => isActive ? styles.mobileActiveLink : styles.mobileLink}
                        onClick={closeMobileMenu}
                    >
                        Categories
                    </NavLink>
                    <NavLink
                        to="/cart"
                        style={({ isActive }) => isActive ? styles.mobileActiveLink : styles.mobileLink}
                        onClick={closeMobileMenu}
                    >
                        Cart
                    </NavLink>

                    {isAuthenticated ? (
                        <button
                            onClick={handleLogout}
                            style={styles.mobileLogoutButton}
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            <NavLink
                                to="/login"
                                style={({ isActive }) => isActive ? styles.mobileActiveLink : styles.mobileLink}
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
        color: '#2D5FFF', // Primary
        textDecoration: 'none',
    },
    desktopMenu: {
        display: 'flex', // Hidden on mobile via CSS media query usually, but here we use JS state or just hide if window width is small. 
        // Since we can't easily do media queries in inline styles, we'll rely on the mobile menu button logic 
        // or assume this is a simple implementation. 
        // For a robust solution, we'd use a CSS file.
        // I will add a simple display: 'none' logic if I could detect width, but React inline styles are tricky for responsiveness.
        // Instead, I'll use a CSS class approach if possible, but I'm restricted to inline styles by the prompt style mostly.
        // Let's try to simulate it by just showing it and hiding on mobile if I could, 
        // but for now I'll just render it and let the user know it's a basic responsive implementation.
        // actually, I can't hide it easily without window resize listener or CSS.
        // I will add a style block to the document head or just use a simple approach.
        alignItems: 'center',
        gap: '32px',
    },
    link: {
        textDecoration: 'none',
        color: '#667085',
        fontWeight: '500',
        fontSize: '16px',
        transition: 'color 0.2s',
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
        transition: 'background-color 0.2s',
    },
    logoutButton: {
        backgroundColor: 'transparent',
        border: '1px solid #D0D5DD',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: '600',
        color: '#344054',
    },
    mobileMenuButton: {
        display: 'none', // Hidden by default, shown on mobile via CSS
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
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    mobileLink: {
        textDecoration: 'none',
        color: '#667085',
        fontSize: '18px',
        fontWeight: '500',
        padding: '8px 0',
    },
    mobileActiveLink: {
        textDecoration: 'none',
        color: '#2D5FFF',
        fontSize: '18px',
        fontWeight: '600',
        padding: '8px 0',
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
        fontFamily: 'inherit',
        fontSize: '16px',
    },
};

// Inject media queries for responsiveness
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

// Add classes to elements for media query targeting
// Note: In a real app, we'd use CSS modules or styled-components.
// Here we patch it by modifying the style objects slightly or just relying on the injected CSS
// to target classes we add manually.

// Let's modify the component to use className for the responsive parts
// I'll update the render method above to include classNames.

export default Navbar;
