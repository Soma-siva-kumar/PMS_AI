import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';
import './Dashboard.css';

const PatientDashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [caretakers, setCaretakers] = useState([]);
    const [vitals, setVitals] = useState({
        heartRate: 72,
        bloodPressure: '120/80',
        temperature: 98.6,
        spo2: 98,
        bloodLevel: 14.5,
        salineLevel: 85
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            if (user?.isGuest) {
                // Mock connections for Guest Patient
                setCaretakers([
                    { _id: 'ct1', name: 'Dr. Sarah Connor', uniqueId: 'S101', role: 'Staff' }
                ]);
                setLoading(false);
                return;
            }

            if (!user?.id) { setLoading(false); return; }
            try {
                const [caretakerRes, vitalRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/users/connections/${user.id}`),
                    axios.get(`${BASE_URL}/api/vitals/${user.id}/latest`)
                ]);
                setCaretakers(caretakerRes.data);
                if (vitalRes.data && vitalRes.data.heartRate) {
                    setVitals(vitalRes.data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                addToast('Failed to load dashboard data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id, user?.isGuest, addToast]);

    const simulateVitals = async () => {
        const bpSystolic = Math.floor(Math.random() * (130 - 110 + 1) + 110);
        const bpDiastolic = Math.floor(Math.random() * (85 - 75 + 1) + 75);
        const newData = {
            patient: user?.id || 'guest',
            heartRate: Math.floor(Math.random() * (90 - 65 + 1) + 65),
            bloodPressure: `${bpSystolic}/${bpDiastolic}`,
            temperature: (97 + Math.random() * 3).toFixed(1),
            spo2: Math.floor(Math.random() * (100 - 95 + 1) + 95),
            bloodLevel: (12 + Math.random() * 4).toFixed(1),
            salineLevel: Math.max(0, vitals.salineLevel - 1)
        };

        if (user?.isGuest) {
            setVitals(newData);
            addToast('Guest Mode: Vitals updated locally', 'success');
            return;
        }

        try {
            const res = await axios.post(`${BASE_URL}/api/vitals/update`, newData);
            setVitals(res.data);
            addToast('Vitals updated via AI monitoring', 'success');
        } catch (error) {
            addToast('Simulation failed', 'error');
        }
    };

    const handleEmergency = () => {
        addToast('EMERGENCY SIGNAL SENT TO ALL CARETAKERS!', 'error');
    };

    if (loading) return <SkeletonDashboard />;

    const salineStatus = vitals.salineLevel < 20 ? 'error' : vitals.salineLevel < 50 ? 'warning' : 'success';

    return (
        <div className="dashboard-container">
            <DashboardHeader user={user} notificationCount={2} />

            <div className="dashboard-hero-section">
                <div className="hero-action-group">
                    <button className="emergency-btn pulse-red" onClick={handleEmergency}>
                        <i className="fas fa-bell"></i> EMERGENCY ALERT
                    </button>

                </div>
            </div>

            <div className="dashboard-main-content animate-fade-in" style={{ marginTop: '20px' }}>
                {/* Connect with Care Providers Card */}
                <div className="dashboard-section glass-panel animate-slide-up" style={{ marginBottom: '25px' }}>
                    <div className="section-title-group" style={{ marginBottom: '15px' }}>
                        <h3 className="section-title-alt"><i className="fas fa-user-plus"></i> Connect with Care Providers</h3>
                        <p className="section-subtitle">Search to add staff, caretakers, or family members.</p>
                    </div>
                    <div className="search-action-container" style={{ marginTop: '10px' }}>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            onClick={() => navigate('/search')}
                        >
                            <i className="fas fa-user-plus"></i> Find Care Providers
                        </button>
                    </div>
                </div>

                {/* My Care Team Card */}
                <div className="dashboard-section glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="section-title-group" style={{ marginBottom: '15px' }}>
                        <h3 className="section-title-alt"><i className="fas fa-users"></i> My Care Team</h3>
                        <p className="section-subtitle">Manage your connected caretakers, family members, and staff.</p>
                    </div>
                    <div className="search-bar-container" style={{ position: 'relative', marginBottom: '20px' }}>
                        <i className="fas fa-filter" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search connected people..." 
                            style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                    </div>

                    {caretakers.length > 0 ? (
                        <div className="caretaker-list chat-style-list">
                            {caretakers.map(ct => (
                                <div key={ct._id || ct.id} className="chat-row glass-panel" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/admin/user/${ct._id || ct.id}`)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="chat-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                                            {ct.profilePicture ? <img src={ct.profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user-md"></i>}
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                <strong style={{ fontSize: '1rem' }}>{ct.name}</strong>
                                                <span className="chat-id" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px' }}>{ct.uniqueId}</span>
                                            </div>
                                            <p className="chat-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>{ct.role || 'Provider'}</p>
                                        </div>
                                    </div>
                                    <div className="chat-action">
                                        <button className="icon-btn-sm tooltip" onClick={() => navigate(`/dashboard/admin/user/${ct._id || ct.id}`)} title="View Details" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)' }}>
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-compact" style={{ textAlign: 'center', padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                            <i className="fas fa-user-friends" style={{ fontSize: '2rem', color: 'var(--text-muted)', opacity: 0.5, marginBottom: '10px' }}></i>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No one is in your care team yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

