import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getDashboardPath = () => {
        if (!user) return '/';
        const role = user.role?.toLowerCase();
        if (role === 'patient') return '/dashboard/patient';
        if (role === 'caretaker') return '/dashboard/staff';
        if (role === 'family') return '/dashboard/family';
        if (role === 'admin') return '/dashboard/admin';
        return '/dashboard';
    };

    const navItems = [
        { path: getDashboardPath(), icon: 'fa-columns', label: 'Dashboard' },
        { path: '/search', icon: 'fa-search', label: 'Search' },
        { path: '/profile', icon: 'fa-user', label: 'Profile' },
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            {/* Mobile hamburger */}
            <button
                className="mobile-menu-btn"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
            >
                <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>

            <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    {!collapsed && <span>Paryavekshan</span>}
                </div>

                <nav className="sidebar-nav">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
                            title={collapsed ? item.label : ''}
                            onClick={closeMobile}
                        >
                            <i className={`fas ${item.icon}`}></i>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-link logout" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
                        <i className="fas fa-sign-out-alt"></i>
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            <button
                className={`sidebar-toggle ${collapsed ? 'collapsed' : ''}`}
                onClick={() => setCollapsed(!collapsed)}
                aria-label="Toggle sidebar"
            >
                <i className={`fas fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
            </button>

            <div className={`sidebar-overlay ${mobileOpen ? 'visible' : ''}`} onClick={closeMobile}></div>
        </>
    );
};

export default Sidebar;

