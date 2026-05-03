import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './Toast';
import './Dashboard/Dashboard.css';

const Profile = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || ''
    });

    const navigate = useNavigate();
    const { addToast } = useToast();
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const photoMenuRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`http://localhost:5000/api/users/profile/${user.id}`);
                const latestUser = { ...user, ...res.data };
                localStorage.setItem('user', JSON.stringify(latestUser));
                setUser(latestUser);
                setEditData({
                    name: latestUser.name || '',
                    email: latestUser.email || '',
                    phoneNumber: latestUser.phoneNumber || ''
                });
            } catch (err) {
                console.error('Error fetching user data:', err);
            }
        };
        fetchUserData();

        const handleClickOutside = (event) => {
            if (photoMenuRef.current && !photoMenuRef.current.contains(event.target)) {
                setShowPhotoMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`http://localhost:5000/api/users/profile/${user.id}`, editData);
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            addToast('Profile updated successfully!', 'success');
        } catch (err) {
            addToast('Failed to update profile', 'error');
        }
    };

    const handlePhotoAction = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setShowPhotoMenu(false);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result;
            try {
                await axios.put(`http://localhost:5000/api/users/profile/${user.id}/photo`, { photo: base64data });
                const updatedUser = { ...user, profilePicture: base64data };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                addToast('Profile picture updated!', 'success');
            } catch (err) {
                addToast('Failed to update photo', 'error');
            } finally {
                setUploading(false);
            }
        };
    };

    return (
        <div className="dashboard-container">
            <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handlePhotoAction} />
            <input type="file" accept="image/*" capture="user" ref={cameraInputRef} style={{display: 'none'}} onChange={handlePhotoAction} />

            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <h2 className="section-title">My Profile</h2>
                    <p className="section-subtitle">Manage your account information and preferences.</p>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline">Back</button>
            </header>

            <div className="profile-page-wrapper animate-fade-in">
                <div className="profile-card glass-panel animate-slide-up">
                    <div className="profile-header-section">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-large" onClick={() => setShowPhotoMenu(!showPhotoMenu)}>
                                {user?.profilePicture ? (
                                    <img src={user.profilePicture} alt="Avatar" />
                                ) : (
                                    <i className="fas fa-user-circle"></i>
                                )}
                                <div className="edit-overlay">
                                    <i className="fas fa-camera"></i>
                                </div>
                            </div>
                            
                            {showPhotoMenu && (
                                <div className="photo-source-menu glass-panel animate-fade-in" ref={photoMenuRef}>
                                    <button className="source-item" onClick={(e) => { e.stopPropagation(); cameraInputRef.current.click(); }}>
                                        <i className="fas fa-camera"></i> Camera
                                    </button>
                                    <button className="source-item" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
                                        <i className="fas fa-image"></i> Gallery
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="profile-identity">
                            <h1>{user?.name}</h1>
                            <div className="identity-badges">
                                <span className="role-badge">{user?.role}</span>
                                <span className="id-badge">ID: {user?.uniqueId}</span>
                            </div>
                            {uploading && <p className="sync-status"><i className="fas fa-sync fa-spin"></i> Updating Cloud...</p>}
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="profile-form">
                        <div className="profile-form-grid">
                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-user"></i> Full Name</label>
                                <div className="profile-value-box">
                                    {isEditing ? (
                                        <input type="text" value={editData.name} 
                                            onChange={(e) => setEditData({...editData, name: e.target.value})} />
                                    ) : (
                                        <p className="static-value">{user?.name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-envelope"></i> Email Address</label>
                                <div className="profile-value-box">
                                    {isEditing ? (
                                        <input type="email" value={editData.email} 
                                            onChange={(e) => setEditData({...editData, email: e.target.value})} />
                                    ) : (
                                        <p className="static-value">{user?.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-phone"></i> Phone Number</label>
                                <div className="profile-value-box">
                                    {isEditing ? (
                                        <input type="text" value={editData.phoneNumber} placeholder="Add your phone number"
                                            onChange={(e) => setEditData({...editData, phoneNumber: e.target.value})} />
                                    ) : (
                                        <p className="static-value">{user?.phoneNumber || 'Not provided'}</p>
                                    )}
                                </div>
                            </div>

                            {user?.role === 'Admin' && (
                                <>
                                    <div className="form-group profile-group">
                                        <label className="profile-label"><i className="fas fa-hospital"></i> Hospital Name</label>
                                        <div className="profile-value-box">
                                            <p className="static-value">{user?.hospitalName || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="form-group profile-group">
                                        <label className="profile-label"><i className="fas fa-map-marker-alt"></i> Location</label>
                                        <div className="profile-value-box">
                                            <p className="static-value">{user?.hospitalLocation || 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="profile-footer-actions">
                            {isEditing ? (
                                <>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="fas fa-save"></i> Save Profile
                                    </button>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)}>
                                    <i className="fas fa-edit"></i> Edit Profile
                                </button>
                            )}
                            <button type="button" className="btn btn-outline danger-text" onClick={() => { localStorage.clear(); navigate('/'); }}>
                                <i className="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;

