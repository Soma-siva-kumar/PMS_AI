import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';
import './Dashboard.css';

const AdminDashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [staff, setStaff] = useState([]);
    const [patients, setPatients] = useState([]);
    const [activeTab, setActiveTab] = useState('patients');
    const [loading, setLoading] = useState(true);
    const [vitals, setVitals] = useState({});
    const [liveVitals, setLiveVitals] = useState({});
    const [connected, setConnected] = useState(false);
    const socketRef = useRef();
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.isGuest) {
                // Guest mode now fetches real data if available, or shows empty state
                // Removed mock data as requested
            }

            if (!user?.id && !user?.hospitalName) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                let latestUser = user;
                // Only fetch profile if we have a real user ID
                if (user?.id) {
                    const profileRes = await axios.get(`${BASE_URL}/api/users/profile/${user.id}`);
                    latestUser = { ...user, ...profileRes.data };
                    localStorage.setItem('user', JSON.stringify(latestUser));
                }
                
                const adminId = latestUser.id || latestUser._id;
                const [stRes, ptRes, vtRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/users/caretakers?admittedBy=${adminId}`),
                    axios.get(`${BASE_URL}/api/users/patients?admittedBy=${adminId}`),
                    axios.get(`${BASE_URL}/api/vitals/latest-all`)
                ]);
                
                const hospital = latestUser.hospitalName?.toLowerCase();
                
                if (!hospital) {
                    addToast('Please complete your hospital profile to manage staff and patients.', 'warning');
                    setLoading(false);
                    return;
                }

                // Map vitals by patient uniqueId for easier lookup
                const vitalsMap = {};
                // Since vtRes.data is { patientObjectId: vitalRecord }, we need to map it
                // Actually, let's keep it simple and just use the patient's uniqueId if we can
                // But the patient objects have uniqueId, and the vitals have patientObjectId
                setStaff(stRes.data);
                setPatients(ptRes.data);
                setVitals(vtRes.data);
            } catch (error) {
                console.error('Error fetching admin data:', error);
                addToast('Database sync failed. Please check your cloud connection.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Socket logic
        socketRef.current = io(BASE_URL);

        socketRef.current.on('connect', () => {
            setConnected(true);
            socketRef.current.emit('join-admin-room');
        });

        socketRef.current.on('saline-level', (data) => {
            // data: { patientId, percentage, timestamp }
            // patientId here is uniqueId (e.g. P101)
            // We need to update the vitals state. 
            // The bulk vitals fetch returns { objectId: record }
            // Let's find the patient with this uniqueId
            setVitals(prev => {
                const updated = { ...prev };
                // Search for the patient with this uniqueId to get their objectId
                // This is a bit inefficient, but works for now.
                // Ideally the socket event would send the objectId too.
                return updated;
            });
            
            // Actually, let's just store the live updates in a separate map by uniqueId
            setLiveVitals(prev => ({
                ...prev,
                [data.patientId]: data.percentage
            }));
        });

        socketRef.current.on('disconnect', () => setConnected(false));

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user?.id, user?.isGuest, addToast]);

    if (loading) return <SkeletonDashboard />;

    const currentList = activeTab === 'staff' ? staff : patients;

    const renderUserList = (list, type) => (
        <div className="user-list">
            {list.length > 0 ? list.map(u => (
                <div key={u._id} className="user-row glass-panel clickable-row" onClick={() => navigate(`/dashboard/admin/user/${u._id}`)}>
                    <div className="user-profile-info">
                        <div className="user-avatar-mini">
                            {u.profilePicture ? <img src={u.profilePicture} alt="Avatar" /> : <i className="fas fa-user-circle"></i>}
                        </div>
                        <div className="user-details" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <strong>{u.name}</strong>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {u.uniqueId}</span>
                                {type === 'patients' && (
                                    (() => {
                                        const pv = vitals[u._id];
                                        const ts = pv ? new Date(pv.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Not yet';
                                        return (
                                            <span className="ai-last-updated" style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--glass-bright)', padding: '3px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '5px', border: '1px solid var(--border)' }}>
                                                <i className="fas fa-clock"></i> Last Updated: {ts}
                                            </span>
                                        );
                                    })()
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="row-action-indicator">
                        <i className="fas fa-chevron-right"></i>
                    </div>
                </div>
            )) : (
                <div className="empty-state glass-panel">
                    <i className="fas fa-inbox"></i>
                    <p>No {type} registered in the system yet.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="dashboard-container">
            <DashboardHeader user={user} notificationCount={5} />

            <div className="admin-overview animate-fade-in">
                <div className="section-title-group">
                    <div className="hospital-badge">
                        <i className="fas fa-hospital"></i> {user?.hospitalName || 'General Hospital'}
                    </div>
                    <h3 className="section-title">Hospital Management Console</h3>
                    <p className="section-subtitle">Dedicated oversight of clinical staff and registered patients.</p>
                    <div className={`live-status ${connected ? 'online' : 'offline'}`}>
                        <span className="pulse-dot"></span> {connected ? 'Real-time database sync active' : 'Connecting to database...'}
                    </div>
                </div>
                <div className="admin-stats-row">
                    <div className="admin-stat-card glass-panel">
                        <i className="fas fa-user-md"></i>
                        <div>
                            <strong>{staff.length}</strong>
                            <span>Staff</span>
                        </div>
                    </div>
                    <div className="admin-stat-card glass-panel">
                        <i className="fas fa-user-injured"></i>
                        <div>
                            <strong>{patients.length}</strong>
                            <span>Patients</span>
                        </div>
                    </div>
                    <div className="admin-stat-card glass-panel">
                        <i className="fas fa-bed"></i>
                        <div>
                            <strong>{patients.length} / 50</strong>
                            <span>Occupancy</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mobile-only-management animate-slide-up">
                <div className="mobile-action-buttons">
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/admin/add-patient')}>
                        <i className="fas fa-plus"></i> Add Patient
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/dashboard/admin/add-staff')}>
                        <i className="fas fa-user-plus"></i> Add Staff
                    </button>
                </div>
                
                <div className="mobile-category-tabs">
                    <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('patients')}>
                        <i className="fas fa-user-injured"></i> Patients ({patients.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                            onClick={() => setActiveTab('staff')}>
                        <i className="fas fa-user-md"></i> Staff ({staff.length})
                    </button>
                </div>

                <div className="mobile-list-view">
                    {renderUserList(currentList, activeTab)}
                </div>
            </div>

            <div className="admin-tabs-row desktop-only">
                <div className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('patients')}>
                        <i className="fas fa-user-injured"></i> Patients ({patients.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                            onClick={() => setActiveTab('staff')}>
                        <i className="fas fa-user-md"></i> Staff ({staff.length})
                    </button>
                </div>
                
                <div className="admin-actions">
                    <button className="btn btn-primary add-staff-btn" onClick={() => navigate('/dashboard/admin/add-staff')}>
                        <i className="fas fa-user-plus"></i> Add Staff
                    </button>
                    <button className="btn btn-primary add-patient-btn" onClick={() => navigate('/dashboard/admin/add-patient')}>
                        <i className="fas fa-plus"></i> Add Patient
                    </button>
                </div>
            </div>

            <div className="admin-content-area animate-slide-up desktop-only">
                {renderUserList(currentList, activeTab)}
            </div>
        </div>
    );
};

export default AdminDashboard;

