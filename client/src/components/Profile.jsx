import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './Toast';
import { BASE_URL } from '../api';
import './Dashboard/Dashboard.css';

const Profile = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showAIKey, setShowAIKey] = useState(false);
    const [isEditingAIKey, setIsEditingAIKey] = useState(false);
    const [aiKeyInput, setAIKeyInput] = useState(user?.aiApiKey || '');
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        aiApiKey: user?.aiApiKey || '',
        aiSourceType: user?.aiSourceType || 'none',
        aiSourceUrl: user?.aiSourceUrl || ''
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
                const res = await axios.get(`${BASE_URL}/api/users/profile/${user.id}`);
                const latestUser = { ...user, ...res.data };
                localStorage.setItem('user', JSON.stringify(latestUser));
                setUser(latestUser);
                setEditData({
                    name: latestUser.name || '',
                    email: latestUser.email || '',
                    phoneNumber: latestUser.phoneNumber || '',
                    aiApiKey: latestUser.aiApiKey || '',
                    aiSourceType: latestUser.aiSourceType || 'none',
                    aiSourceUrl: latestUser.aiSourceUrl || ''
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
            const res = await axios.put(`${BASE_URL}/api/users/profile/${user.id}`, editData);
            const updatedUser = { ...user, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditing(false);
            addToast('Profile updated successfully!', 'success');
        } catch (err) {
            addToast('Failed to update profile', 'error');
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await axios.post(`${BASE_URL}/api/users/upload-ai-video/${user.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setEditData({ ...editData, aiSourceUrl: res.data.url, aiSourceType: 'file' });
            addToast('Video uploaded successfully!', 'success');
        } catch (err) {
            addToast('Video upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateAIKey = async () => {
        try {
            const res = await axios.put(`${BASE_URL}/api/users/profile/${user.id}`, {
                ...user,
                aiApiKey: aiKeyInput
            });
            const updatedUser = { ...user, aiApiKey: res.data.aiApiKey };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsEditingAIKey(false);
            addToast('AI Connection Key updated!', 'success');
        } catch (err) {
            addToast('Failed to update AI Key', 'error');
        }
    };

    const handlePhotoAction = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setUploading(true);
        setShowPhotoMenu(false);

        try {
            const res = await axios.post(`${BASE_URL}/api/users/upload-profile/${user.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const updatedUser = { ...user, profilePicture: res.data.profilePicture };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            addToast('Profile picture updated successfully!', 'success');
        } catch (err) {
            console.error('Upload error:', err);
            addToast('Failed to upload photo. Check Cloudinary settings.', 'error');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <input type="file" accept="image/*" ref={fileInputRef} style={{display: 'none'}} onChange={handlePhotoAction} />
            <input type="file" accept="image/*" capture="user" ref={cameraInputRef} style={{display: 'none'}} onChange={handlePhotoAction} />

            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <div className="brand-title-area" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => navigate(-1)} className="back-btn-minimal" title="Back">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h2 className="section-title" style={{ margin: 0 }}>{user?.name || 'Profile'}</h2>
                    </div>
                    <p className="section-subtitle" style={{ margin: 0, marginTop: '5px' }}>Manage your account information and preferences.</p>
                </div>
            </header>

            <div className="profile-page-wrapper animate-fade-in">
                {user?.role === 'Patient' && (
                    <>
                        {/* Clinical Monitoring Suite Card */}
                        <div className="profile-card glass-panel animate-slide-up">
                            <div className="clinical-suite">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-eye"></i> AI Monitoring</h3>
                                    <span className="ai-last-updated" style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--glass-bright)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                        <i className="fas fa-clock"></i> Last Updated: Not yet
                                    </span>
                                </div>

                                <div className="ai-metrics-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {/* Saline Bottle Level */}
                                    <div 
                                        className="metric-row clickable-card" 
                                        onClick={() => navigate(`/monitor/${user.uniqueId}/saline`)}
                                        style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                                <i className="fas fa-prescription-bottle-alt" style={{ color: '#00d2ff' }}></i> Saline bottle level detection
                                            </h4>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ flex: 1, background: 'var(--border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                                <div style={{ width: '0%', height: '100%', background: '#00d2ff', transition: 'width 0.5s ease' }}></div>
                                            </div>
                                            <span style={{ fontWeight: 'bold', minWidth: '45px', fontSize: '1.1rem', color: '#00d2ff' }}>0%</span>
                                        </div>
                                    </div>

                                    {/* Patient Posture */}
                                    <div 
                                        className="metric-row clickable-card" 
                                        onClick={() => navigate(`/monitor/${user.uniqueId}/posture`)}
                                        style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                                <i className="fas fa-bed" style={{ color: '#a29bfe' }}></i> Patient posture Detection
                                            </h4>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Not detected yet</div>
                                        </div>
                                    </div>

                                    {/* Hand gesture detection */}
                                    <div 
                                        className="metric-row clickable-card" 
                                        onClick={() => navigate(`/monitor/${user.uniqueId}/gestures`)}
                                        style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                                <i className="fas fa-hand-paper" style={{ color: '#55efc4' }}></i> Hand gesture detection
                                            </h4>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#55efc4' }}>No</div>
                                        </div>
                                    </div>

                                    {/* Unknown Person Detection */}
                                    <div 
                                        className="metric-row clickable-card" 
                                        onClick={() => navigate(`/monitor/${user.uniqueId}/unknown`)}
                                        style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                                <i className="fas fa-user-secret" style={{ color: '#ff7675' }}></i> Unknown Person Detection
                                            </h4>
                                            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#ff7675' }}>No</div>
                                        </div>
                                    </div>

                                    {/* AI Connection Key Card - Premium */}
                                    <div className="ai-config-card" style={{ 
                                        marginTop: '12px', 
                                        padding: '20px', 
                                        background: 'rgba(0, 210, 255, 0.04)', 
                                        borderRadius: '16px', 
                                        border: '1px solid rgba(0, 210, 255, 0.15)',
                                        boxShadow: '0 8px 32px 0 rgba(0, 210, 255, 0.05)'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-shield-alt"></i> AI Connection Key
                                            </label>
                                            {user?.aiApiKey && !isEditingAIKey && (
                                                <>
                                                    <button 
                                                        type="button"
                                                        className="edit-room-btn" 
                                                        onClick={() => setShowAIKey(!showAIKey)} 
                                                        style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                                                        title={showAIKey ? "Hide Key" : "Show Key"}
                                                    >
                                                        <i className={showAIKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        className="edit-room-btn" 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.aiApiKey);
                                                            addToast('Key copied to clipboard!', 'success');
                                                        }} 
                                                        style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                                                        title="Copy Key"
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </>
                                            )}
                                            {!isEditingAIKey && (
                                                <button 
                                                    type="button"
                                                    className="edit-room-btn" 
                                                    onClick={() => {
                                                        setIsEditingAIKey(true);
                                                        setAIKeyInput(user?.aiApiKey || '');
                                                    }} 
                                                    style={{ fontSize: '0.75rem' }}
                                                >
                                                    <i className="fas fa-edit"></i> Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                        {isEditingAIKey ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <input 
                                                    type="text" 
                                                    value={aiKeyInput} 
                                                    placeholder="Enter secret AI API key"
                                                    onChange={(e) => setAIKeyInput(e.target.value)} 
                                                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'monospace' }}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="button" className="btn btn-primary btn-xs" style={{ flex: 1 }} onClick={handleUpdateAIKey}>Save Key</button>
                                                    <button type="button" className="btn btn-outline btn-xs" style={{ flex: 1 }} onClick={() => setIsEditingAIKey(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: '0.95rem', 
                                                fontFamily: 'monospace', 
                                                color: 'var(--text-main)', 
                                                letterSpacing: showAIKey ? '1px' : '3px',
                                                opacity: user?.aiApiKey ? 1 : 0.3
                                            }}>
                                                {user?.aiApiKey ? (showAIKey ? user.aiApiKey : '••••••••••••••••') : 'NO_KEY_CONFIGURED'}
                                            </p>
                                        )}
                                    </div>
                                        <p style={{ margin: '10px 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                            <i className="fas fa-info-circle"></i> Use this key to authenticate your AI Engine.
                                        </p>
                                    </div>
                                </div>
                            </div>


                        {/* Dedicated Video Feed Source Card */}

                        <div className="profile-card glass-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <div className="clinical-suite">
                                <h3 className="suite-title"><i className="fas fa-video"></i> Video Source Management</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                                    Configure the primary video feed for AI analysis.
                                </p>

                                <div className="ai-config-card" style={{ 
                                    padding: '20px', 
                                    background: 'rgba(255, 255, 255, 0.04)', 
                                    borderRadius: '16px', 
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        setEditData({...editData, aiSourceType: 'file'});
                                                        fileInputRef.current?.click();
                                                    }}
                                                    style={{ 
                                                        padding: '12px 5px', 
                                                        borderRadius: '12px', 
                                                        border: editData.aiSourceType === 'file' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                        background: editData.aiSourceType === 'file' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                        color: editData.aiSourceType === 'file' ? '#00d2ff' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {uploading ? (
                                                        <i className="fas fa-spinner fa-spin" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                    ) : (
                                                        <i className="fas fa-file-video" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                    )}
                                                    Local Video
                                                </button>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    style={{ display: 'none' }} 
                                                    accept="video/*" 
                                                    onChange={handleVideoUpload} 
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditData({...editData, aiSourceType: 'mobile'})}
                                                    style={{ 
                                                        padding: '12px 5px', 
                                                        borderRadius: '12px', 
                                                        border: editData.aiSourceType === 'mobile' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                        background: editData.aiSourceType === 'mobile' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                        color: editData.aiSourceType === 'mobile' ? '#00d2ff' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <i className="fas fa-mobile-alt" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                    Mobile Cam
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setEditData({...editData, aiSourceType: 'cctv'})}
                                                    style={{ 
                                                        padding: '12px 5px', 
                                                        borderRadius: '12px', 
                                                        border: editData.aiSourceType === 'cctv' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                        background: editData.aiSourceType === 'cctv' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                        color: editData.aiSourceType === 'cctv' ? '#00d2ff' : 'var(--text-muted)',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <i className="fas fa-video" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                    CCTV Cam
                                                </button>
                                            </div>

                                            {editData.aiSourceType !== 'none' && (
                                                <div className="input-with-action">
                                                    {editData.aiSourceType === 'file' ? (
                                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                            <input 
                                                                type="text"
                                                                placeholder="Video URL"
                                                                value={editData.aiSourceUrl}
                                                                readOnly
                                                                style={{ flex: 1, padding: '12px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div style={{ position: 'relative' }}>
                                                            <i className={editData.aiSourceType === 'mobile' ? "fas fa-mobile-alt" : "fas fa-video"} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#00d2ff' }}></i>
                                                            <input 
                                                                type="text"
                                                                placeholder={editData.aiSourceType === 'mobile' ? "http:// IP Address" : "rtsp:// URL"}
                                                                value={editData.aiSourceUrl}
                                                                onChange={(e) => setEditData({...editData, aiSourceUrl: e.target.value})}
                                                                style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d2ff' }}>
                                                    <i className={user?.aiSourceType === 'file' ? 'fas fa-file-video' : user?.aiSourceType === 'mobile' ? 'fas fa-mobile-alt' : user?.aiSourceType === 'cctv' ? 'fas fa-video' : 'fas fa-video-slash'}></i>
                                                </div>
                                                <div>
                                                    <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>
                                                        {user?.aiSourceType === 'file' ? 'Local Demo Video' : 
                                                         user?.aiSourceType === 'mobile' ? 'Mobile IP Cam' : 
                                                         user?.aiSourceType === 'cctv' ? 'Professional CCTV' : 'Not Configured'}
                                                    </h5>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{user?.aiSourceUrl || 'No source linked'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Connected People Card */}
                        <div className="profile-card glass-panel animate-slide-up" style={{ animationDelay: '0.05s', marginTop: '25px', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-network-wired"></i> Connected People</h3>
                                <span style={{ fontSize: '0.8rem', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '4px 10px', borderRadius: '15px', border: '1px solid rgba(0,210,255,0.3)' }}>
                                    0 Active Now
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-user-slash" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No connections at the moment.<br/>People will appear here when they connect to you.</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

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

                            {user?.role === 'Patient' && (
                                <>
                                    <div className="form-group profile-group">
                                        <label className="profile-label"><i className="fas fa-calendar-alt"></i> Admission Date</label>
                                        <div className="profile-value-box">
                                            <p className="static-value">
                                                {user?.admissionDate 
                                                    ? new Date(user.admissionDate).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) 
                                                    : 'Record not dated'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="form-group profile-group">
                                        <label className="profile-label"><i className="fas fa-door-open"></i> Assigned Room</label>
                                        <div className="profile-value-box">
                                            <p className="static-value">{user?.roomNumber || 'Not assigned'}</p>
                                        </div>
                                    </div>
                                    <div className="form-group profile-group">
                                        <label className="profile-label"><i className="fas fa-hospital"></i> Connected Facility</label>
                                        <div className="profile-value-box">
                                            <p className="static-value">{user?.hospitalName || 'Unassigned'}</p>
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

