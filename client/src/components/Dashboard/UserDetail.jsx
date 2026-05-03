import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Toast';
import { SkeletonCard } from '../Skeleton';
import './Dashboard.css';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMonitoring, setShowMonitoring] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/users/profile/${id}`);
                setTargetUser(res.data);
            } catch (err) {
                addToast('Failed to load user details', 'error');
                navigate('/dashboard/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, addToast, navigate]);

    const handleRemoveFromHospital = async () => {
        if (!window.confirm(`Are you sure you want to remove ${targetUser.name} from your hospital records?`)) return;

        try {
            await axios.put(`http://localhost:5000/api/users/profile/${id}`, {
                hospitalName: '',
                hospitalLocation: '',
                admissionDate: null,
                roomNumber: ''
            });
            addToast(`${isStaff ? 'Staff' : 'Patient'} successfully removed from hospital`, 'success');
            navigate('/dashboard/admin');
        } catch (err) {
            addToast('Failed to remove from hospital', 'error');
        }
    };

    if (loading) return (
        <div className="dashboard-container">
            <SkeletonCard />
        </div>
    );

    if (!targetUser) return null;

    const isStaff = targetUser.role === 'Staff' || targetUser.role === 'Caretaker';
    const admissionLabel = isStaff ? 'Hiring Date' : 'Admission Date';

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <h2 className="section-title">{isStaff ? 'Staff Profile' : 'Patient Records'}</h2>
                    <p className="section-subtitle">Official facility records for {targetUser.name}.</p>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline">Back to Console</button>
            </header>

            <div className="profile-page-wrapper animate-fade-in">
                <div className="profile-card glass-panel animate-slide-up">
                    <div className="profile-header-section">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-large">
                                {targetUser.profilePicture ? (
                                    <img src={targetUser.profilePicture} alt="Avatar" />
                                ) : (
                                    <i className={`fas ${isStaff ? 'fa-user-md' : 'fa-user-injured'}`}></i>
                                )}
                            </div>
                        </div>

                        <div className="profile-identity">
                            <h1>{targetUser.name}</h1>
                            <div className="identity-badges">
                                <span className="role-badge">{targetUser.role}</span>
                                <span className="id-badge">ID: {targetUser.uniqueId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-form">
                        <div className="profile-form-grid">
                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-envelope"></i> Email Address</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.email}</p>
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-phone"></i> Phone Number</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.phoneNumber || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-calendar-alt"></i> {admissionLabel}</label>
                                <div className="profile-value-box">
                                    <p className="static-value">
                                        {targetUser.admissionDate 
                                            ? new Date(targetUser.admissionDate).toLocaleDateString('en-US', {
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

                            {!isStaff && (
                                <div className="form-group profile-group">
                                    <label className="profile-label"><i className="fas fa-door-open"></i> Assigned Room</label>
                                    <div className="profile-value-box">
                                        <p className="static-value">{targetUser.roomNumber || 'Not assigned'}</p>
                                    </div>
                                </div>
                            )}

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-hospital"></i> Connected Facility</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.hospitalName || 'Unassigned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="profile-footer-actions">
                            <button className="btn btn-primary" onClick={() => window.print()}>
                                <i className="fas fa-print"></i> Export Record
                            </button>
                            {isStaff ? (
                                <>
                                    <button className="btn btn-outline" onClick={() => addToast('Shift management coming soon!', 'info')}>
                                        <i className="fas fa-calendar-check"></i> Manage Shifts
                                    </button>
                                    <button className="btn btn-danger-outline" onClick={handleRemoveFromHospital}>
                                        <i className="fas fa-user-minus"></i> Remove
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="btn btn-success" onClick={() => setShowMonitoring(true)}>
                                        <i className="fas fa-plug"></i> Connect for Monitoring
                                    </button>
                                    <button className="btn btn-danger-outline" onClick={handleRemoveFromHospital}>
                                        <i className="fas fa-hospital-user"></i> Remove
                                    </button>
                                </>
                            )}
                        </div>

                        {showMonitoring && (
                            <div className="monitoring-overlay animate-fade-in" onClick={() => setShowMonitoring(false)}>
                                <div className="source-selector-card glass-panel animate-zoom-in" onClick={e => e.stopPropagation()}>
                                    <div className="selector-header">
                                        <h3>Select Video Source</h3>
                                        <button className="close-selector" onClick={() => setShowMonitoring(false)}>&times;</button>
                                    </div>
                                    <div className="source-grid">
                                        <div className="source-option" onClick={() => { addToast('Connecting to CCTV...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-video"></i>
                                            <span>CCTV Feed</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Waiting for Mobile Link...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-mobile-alt"></i>
                                            <span>Mobile Cam</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Initializing System Cam...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-laptop"></i>
                                            <span>System Cam</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Opening File Browser...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-upload"></i>
                                            <span>Upload Video</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isStaff && (
                            <div className="clinical-suite animate-slide-up">
                                <h3 className="suite-title"><i className="fas fa-microscope"></i> Clinical Monitoring Suite</h3>
                                <div className="suite-grid">
                                    <button className="suite-btn" onClick={() => navigate(`/monitor/${targetUser.uniqueId}/live`)}>
                                        <i className="fas fa-video"></i>
                                        <span>Live Feed</span>
                                    </button>
                                    <button className="suite-btn" onClick={() => navigate(`/monitor/${targetUser.uniqueId}/saline`)}>
                                        <i className="fas fa-vial"></i>
                                        <span>Saline Bottle Level</span>
                                    </button>
                                    <button className="suite-btn" onClick={() => navigate(`/monitor/${targetUser.uniqueId}/posture`)}>
                                        <i className="fas fa-bed"></i>
                                        <span>Patient Posture</span>
                                    </button>
                                    <button className="suite-btn" onClick={() => navigate(`/monitor/${targetUser.uniqueId}/gestures`)}>
                                        <i className="fas fa-hand-paper"></i>
                                        <span>Hand Gesture Detection</span>
                                    </button>
                                    <button className="suite-btn" onClick={() => navigate(`/monitor/${targetUser.uniqueId}/unknown`)}>
                                        <i className="fas fa-user-secret"></i>
                                        <span>Unknown Persons</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
