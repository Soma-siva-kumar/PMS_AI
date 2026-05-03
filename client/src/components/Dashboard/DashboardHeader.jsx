import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ThemeSwitcher from '../ThemeSwitcher';
import './Dashboard.css';

const DashboardHeader = ({ user }) => {
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Refs for click-outside detection
    const profileRef = useRef(null);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/users/notifications/${user.id}`);
                setNotifications(res.data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [user?.id]);

    const handleResponse = async (requestId, status) => {
        try {
            await axios.post('http://localhost:5000/api/users/respond', { requestId, status });
            setNotifications(notifications.filter(n => n._id !== requestId));
        } catch (err) {
            alert('Action failed. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <header className="dashboard-header animate-fade-in">
            <div className="user-brand">
                <h2>Hello, {user?.name}</h2>
                <span className="user-role-badge">{user?.role} - {user?.uniqueId}</span>
            </div>
            
            <div className="header-controls">
                <ThemeSwitcher />
                <div className="notification-wrapper" ref={notificationRef}>
                    <button className="icon-btn" title="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                        <i className="fas fa-bell"></i>
                        {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown glass-panel animate-slide-up">
                            <h4>Notifications</h4>
                            <hr />
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n._id} className="notification-item">
                                    <div className="notif-content">
                                        <strong>{n.sender.name} ({n.sender.uniqueId})</strong>
                                        <p>wants to connect with you as a {n.sender.role}.</p>
                                    </div>
                                    <div className="notif-actions">
                                        <button className="btn btn-primary btn-xs" onClick={() => handleResponse(n._id, 'accepted')}>Accept</button>
                                        <button className="btn btn-outline btn-xs" onClick={() => handleResponse(n._id, 'rejected')}>Reject</button>
                                    </div>
                                </div>
                            )) : (
                                <p className="empty-notif">No new notifications</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="profile-dropdown-container">
                    <button className="icon-btn profile-btn" onClick={() => navigate('/profile')} title="My Profile">
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt="Profile" />
                        ) : (
                            <i className="fas fa-user-circle"></i>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
