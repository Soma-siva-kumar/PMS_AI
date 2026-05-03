import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import './Dashboard.css';

const FamilyDashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchPatients = async () => {
            if (!user?.id) { setLoading(false); return; }
            try {
                const res = await axios.get(`http://localhost:5000/api/users/connections/${user.id}`);
                setPatients(res.data);
            } catch (error) {
                console.error('Error fetching connected patients:', error);
                addToast('Failed to load patient data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [user?.id, addToast]);

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="dashboard-container">
            <DashboardHeader user={user} notificationCount={1} />

            <div className="dashboard-main-content animate-fade-in">
                <div className="dashboard-section glass-panel animate-slide-up">
                    <div className="section-title-group">
                        <h3 className="section-title-alt">Family Member Portal</h3>
                        <p className="section-subtitle">Monitor your loved ones' safety status remotely.</p>
                    </div>
                    <div className="dashboard-actions-row">
                        <button className="dashboard-action-card glass-panel" onClick={() => navigate('/search')}>
                            <i className="fas fa-user-plus"></i>
                            <div className="action-card-text">
                                <strong>Connect with Patient</strong>
                                <span>Enter their unique ID to start monitoring.</span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="dashboard-section animate-fade-in" style={{marginTop: '30px'}}>
                    <h3 className="section-title">Loved Ones Being Monitored</h3>
                    <div className="patient-monitor-list">
                        {patients.length > 0 ? patients.map(p => (
                            <div key={p._id || p.id} className="patient-row glass-panel animate-slide-up">
                                <div className="patient-info">
                                    <div className="patient-id-badge">{p.uniqueId}</div>
                                    <div className="patient-name-group">
                                        <strong>{p.name}</strong>
                                        <span>{p.email}</span>
                                    </div>
                                </div>
                                <div className="patient-vitals-snapshot">
                                    <div className="mini-vital">
                                        <label><i className="fas fa-prescription-bottle-alt"></i> Saline</label>
                                        <span className="status-indicator success">Safe</span>
                                    </div>
                                    <div className="mini-vital">
                                        <label><i className="fas fa-user-nurse"></i> Posture</label>
                                        <span className="status-indicator success">Normal</span>
                                    </div>
                                    <div className="mini-vital">
                                        <label><i className="fas fa-heartbeat"></i> Heart Rate</label>
                                        <span>72 bpm</span>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/monitor/${p._id || p.id}`)}>View Full Report</button>
                            </div>
                        )) : (
                            <div className="empty-state glass-panel animate-fade-in">
                                <i className="fas fa-heart"></i>
                                <h3>No patients added</h3>
                                <p>Add a patient using their unique ID to monitor their wellbeing.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>Search Patients</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyDashboard;
