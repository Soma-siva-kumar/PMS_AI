import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
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
            const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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

        const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
                    <button className="btn btn-outline btn-lg" onClick={simulateVitals}>
                        <i className="fas fa-robot"></i> Simulate AI Supervision
                    </button>
                </div>
            </div>

            <div className="dashboard-main-content animate-fade-in">
                {/* AI Supervision Section */}
                <div className="dashboard-section glass-panel animate-slide-up">
                    <div className="section-title-group">
                        <h3 className="section-title-alt">AI Supervision Status</h3>
                        <p className="section-subtitle">Real-time supervision telemetry from Paryavekshan AI.</p>
                    </div>
                    <div className="vitals-grid" style={{ marginTop: '20px' }}>
                        <div className="vital-card glass-panel">
                            <div className="vital-header"><i className="fas fa-prescription-bottle-alt"></i> Saline Level</div>
                            <div className="vital-value">{vitals.salineLevel} <span>%</span></div>
                            <div className={`status-indicator ${salineStatus}`}>
                                {vitals.salineLevel < 20 ? 'Critical' : 'Safe'}
                            </div>
                        </div>

                        <div className="vital-card glass-panel">
                            <div className="vital-header"><i className="fas fa-user-nurse"></i> Posture</div>
                            <div className="vital-value" style={{fontSize: '1.8rem'}}>Stable</div>
                            <div className="status-indicator success">Normal</div>
                        </div>

                        <div className="vital-card glass-panel">
                            <div className="vital-header"><i className="fas fa-user-shield"></i> Security</div>
                            <div className="vital-value" style={{fontSize: '1.8rem'}}>Authorized</div>
                            <div className="status-indicator success">Secure</div>
                        </div>

                        <div className="vital-card glass-panel">
                            <div className="vital-header"><i className="fas fa-sign-language"></i> Gesture</div>
                            <div className="vital-value" style={{fontSize: '1.8rem'}}>None</div>
                            <div className="status-indicator success">Clear</div>
                        </div>
                    </div>
                </div>

                {/* Caretakers Section */}
                <div className="dashboard-section glass-panel animate-slide-up" style={{ marginTop: '30px' }}>
                    <div className="section-title-group">
                        <h3 className="section-title-alt">My Caretakers</h3>
                        <p className="section-subtitle">Search and connect with caretakers and supervisors.</p>
                    </div>
                    <div className="dashboard-actions-row">
                        <button className="dashboard-action-card glass-panel" onClick={() => navigate('/search')}>
                            <i className="fas fa-stethoscope"></i>
                            <div className="action-card-text">
                                <strong>Connect with Caretakers</strong>
                                <span>Find a supervisor to monitor your safety.</span>
                            </div>
                        </button>
                    </div>

                    {caretakers.length > 0 ? (
                        <div className="integrated-list-wrapper animate-fade-in" style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>Connected Providers</h4>
                            <div className="caretaker-list chat-style-list">
                                {caretakers.map(ct => (
                                    <div key={ct._id || ct.id} className="chat-row glass-panel animate-slide-up" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <div className="chat-avatar">
                                            {ct.profilePicture ? <img src={ct.profilePicture} alt="Avatar" /> : <i className="fas fa-user-md"></i>}
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-name-row">
                                                <strong>{ct.name}</strong>
                                                <span className="chat-id">{ct.uniqueId}</span>
                                            </div>
                                            <p className="chat-subtitle">Verified Healthcare Provider</p>
                                        </div>
                                        <div className="chat-action">
                                            <button className="icon-btn-sm tooltip" title="View Details">
                                                <i className="fas fa-info-circle"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state-compact animate-fade-in" style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                            <i className="fas fa-user-md"></i>
                            <p>No caretakers connected yet.</p>
                            <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>Find Caretakers</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;

