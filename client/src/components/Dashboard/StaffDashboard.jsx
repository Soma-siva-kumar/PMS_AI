import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import './Dashboard.css';

const StaffDashboard = () => {
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
                console.error('Error fetching patients:', error);
                addToast('Failed to load patient roster', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, [user?.id, addToast]);

    if (loading) return <SkeletonDashboard />;

    return (
        <div className="dashboard-container">
            <DashboardHeader user={user} notificationCount={5} />

            <div className="dashboard-main-content animate-fade-in">
                <div className="dashboard-section glass-panel animate-slide-up">
                    <div className="section-title-group">
                        <h3 className="section-title-alt">Medical Staff Portal</h3>
                        <p className="section-subtitle">24/7 AI Supervision Roster</p>
                    </div>
                    <div className="admin-stats-row" style={{marginBottom: '20px'}}>
                        <div className="admin-stat-card glass-panel">
                            <i className="fas fa-procedures"></i>
                            <div>
                                <strong>{patients.length}</strong>
                                <span>Patients Assigned</span>
                            </div>
                        </div>
                        <div className="admin-stat-card glass-panel">
                            <i className="fas fa-exclamation-triangle" style={{color: '#f59e0b'}}></i>
                            <div>
                                <strong>2</strong>
                                <span>Active Alerts</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dashboard-section animate-fade-in">
                    <h3 className="section-title">Patient Roster</h3>
                    <div className="patient-monitor-list">
                        {patients.length > 0 ? patients.map(p => (
                            <div key={p._id || p.id} className="patient-row glass-panel animate-slide-up">
                                <div className="patient-info">
                                    <div className="patient-id-badge">{p.uniqueId}</div>
                                    <div className="patient-name-group">
                                        <strong>{p.name}</strong>
                                        <span className="status-active">Room 402</span>
                                    </div>
                                </div>
                                <div className="patient-vitals-snapshot">
                                    <div className="mini-vital">
                                        <label>Saline</label>
                                        <span className="status-indicator success">OK</span>
                                    </div>
                                    <div className="mini-vital">
                                        <label>Security</label>
                                        <span className="status-indicator success">Safe</span>
                                    </div>
                                    <div className="mini-vital">
                                        <label>Posture</label>
                                        <span className="status-indicator warning">Moving</span>
                                    </div>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/monitor/${p._id || p.id}`)}>Live AI Feed</button>
                            </div>
                        )) : (
                            <div className="empty-state glass-panel animate-fade-in">
                                <i className="fas fa-clipboard-list"></i>
                                <h3>No patients assigned</h3>
                                <p>Search and connect with patients to monitor their activities.</p>
                                <button className="btn btn-primary btn-sm" onClick={() => navigate('/search')}>Search Patients</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
