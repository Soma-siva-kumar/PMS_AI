import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ThemeSwitcher from '../ThemeSwitcher';
import { BASE_URL } from '../../api';
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

    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await axios.get(`${BASE_URL}/api/users/notifications/${user.id}`);
            setNotifications(res.data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s as fallback
        return () => clearInterval(interval);
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        
        
        const socket = io(BASE_URL);
        
        // Join private room for real-time notifications
        socket.emit('join-user-room', user.id);
        
        socket.on('new-notification', () => {
            console.log('Instant notification received!');
            fetchNotifications();
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id]);

    const handleResponse = async (requestId, status) => {
        try {
            await axios.post(`${BASE_URL}/api/users/respond`, { 
                requestId, 
                status, 
                userId: user.id 
            });
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
                                        {n.initiatedByAdmin ? (
                                            <>
                                                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                                                    <i className="fas fa-user-shield"></i> Admin Assignment
                                                </strong>
                                                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                                    {user.id === n.sender._id 
                                                        ? `Connect with patient: ${n.recipient?.name} (${n.recipient?.uniqueId})`
                                                        : `Connect with provider: ${n.sender?.name} (${n.sender?.uniqueId})`}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <strong>{n.sender?.name} ({n.sender?.uniqueId})</strong>
                                                <p>wants to connect with you as a {n.sender?.role}.</p>
                                            </>
                                        )}
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
