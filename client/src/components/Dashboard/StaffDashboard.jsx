import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';
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
                const res = await axios.get(`${BASE_URL}/api/users/connections/${user.id}`);
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

            <div className="dashboard-main-content animate-fade-in" style={{ marginTop: '20px' }}>
                {/* Connect with Patients Card */}
                <div className="dashboard-section glass-panel animate-slide-up" style={{ marginBottom: '25px' }}>
                    <div className="section-title-group" style={{ marginBottom: '15px' }}>
                        <h3 className="section-title-alt"><i className="fas fa-user-plus"></i> Connect with Patients</h3>
                        <p className="section-subtitle">Search to find and connect with your patients.</p>
                    </div>
                    <div className="search-bar-container" style={{ position: 'relative' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search patients by name or ID..." 
                            style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '1rem' }}
                            onClick={() => navigate('/search')}
                        />
                    </div>
                </div>

                {/* My Patients Card */}
                <div className="dashboard-section glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="section-title-group" style={{ marginBottom: '15px' }}>
                        <h3 className="section-title-alt"><i className="fas fa-users"></i> My Patients</h3>
                        <p className="section-subtitle">Manage your currently connected patients.</p>
                    </div>
                    <div className="search-bar-container" style={{ position: 'relative', marginBottom: '20px' }}>
                        <i className="fas fa-filter" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                        <input 
                            type="text" 
                            placeholder="Search connected patients..." 
                            style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                    </div>

                    {patients.length > 0 ? (
                        <div className="caretaker-list chat-style-list">
                            {patients.map(p => (
                                <div key={p._id || p.id} className="chat-row glass-panel" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/admin/user/${p._id || p.id}`)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="chat-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                                            {p.profilePicture ? <img src={p.profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user-injured"></i>}
                                        </div>
                                        <div className="chat-info">
                                            <div className="chat-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                                                <span className="chat-id" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px' }}>{p.uniqueId}</span>
                                            </div>
                                            <p className="chat-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>Patient</p>
                                        </div>
                                    </div>
                                    <div className="chat-action" onClick={(e) => e.stopPropagation()}>
                                        <button className="icon-btn-sm tooltip" onClick={() => navigate(`/monitor/${p._id || p.id}`)} title="View Live Feed" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)' }}>
                                            <i className="fas fa-video"></i>
                                        </button>
                                        <button className="icon-btn-sm tooltip" onClick={() => navigate(`/dashboard/admin/user/${p._id || p.id}`)} title="View Details" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-main)' }}>
                                            <i className="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state-compact" style={{ textAlign: 'center', padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
                            <i className="fas fa-user-injured" style={{ fontSize: '2rem', color: 'var(--text-muted)', opacity: 0.5, marginBottom: '10px' }}></i>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>No patients connected yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffDashboard;
