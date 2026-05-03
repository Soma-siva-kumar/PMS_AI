import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardHeader from './DashboardHeader';
import { SkeletonDashboard } from '../Skeleton';
import { useToast } from '../Toast';
import './Dashboard.css';

const AdminDashboard = () => {
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [staff, setStaff] = useState([]);
    const [patients, setPatients] = useState([]);
    const [activeTab, setActiveTab] = useState('staff');
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            setLoading(true);
            try {
                // Fetch the latest user profile to ensure hospital metadata is current
                const profileRes = await axios.get(`http://localhost:5000/api/users/profile/${user.id}`);
                const latestUser = { ...user, ...profileRes.data };
                
                const [stRes, ptRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/users/caretakers'),
                    axios.get('http://localhost:5000/api/users/patients')
                ]);
                
                const hospital = latestUser.hospitalName?.toLowerCase();
                
                if (!hospital) {
                    addToast('Please complete your hospital profile to manage staff and patients.', 'warning');
                    setLoading(false);
                    return;
                }

                const filteredStaff = stRes.data.filter(u => 
                    u.uniqueId?.startsWith('S') && 
                    u.hospitalName?.toLowerCase() === hospital
                );
                
                const filteredPatients = ptRes.data.filter(u => 
                    u.uniqueId?.startsWith('P') && 
                    u.hospitalName?.toLowerCase() === hospital
                );
                
                setStaff(filteredStaff);
                setPatients(filteredPatients);
            } catch (error) {
                console.error('Error fetching admin data:', error);
                addToast('Database sync failed. Please check your cloud connection.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id, addToast]);

    if (loading) return <SkeletonDashboard />;

    const currentList = activeTab === 'staff' ? staff : patients;

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

            <div className="admin-tabs-row">
                <div className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                            onClick={() => setActiveTab('staff')}>
                        <i className="fas fa-user-md"></i> Staff ({staff.length})
                    </button>
                    <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
                            onClick={() => setActiveTab('patients')}>
                        <i className="fas fa-user-injured"></i> Patients ({patients.length})
                    </button>
                </div>
                <div className="admin-actions">
                    <button className="btn btn-outline add-staff-btn" onClick={() => navigate('/dashboard/admin/add-staff')}>
                        <i className="fas fa-user-plus"></i> Add Staff
                    </button>
                    <button className="btn btn-primary add-patient-btn" onClick={() => navigate('/dashboard/admin/add-patient')}>
                        <i className="fas fa-plus"></i> Add Patient
                    </button>
                </div>
            </div>

            <div className="admin-content-area animate-slide-up">
                <div className="user-list">
                    {currentList.length > 0 ? currentList.map(u => (
                        <div key={u._id} className="user-row glass-panel">
                            <div className="user-profile-info">
                                <div className="user-avatar-mini">
                                    {u.profilePicture ? <img src={u.profilePicture} alt="Avatar" /> : <i className="fas fa-user-circle"></i>}
                                </div>
                                <div className="user-details">
                                    <strong>{u.name}</strong>
                                    <span>{u.uniqueId} &bull; {u.email}</span>
                                </div>
                            </div>
                            <div className="user-status-badge">Active</div>
                            <button className="btn btn-outline btn-sm" onClick={() => navigate(`/dashboard/admin/user/${u._id}`)}>
                                Manage
                            </button>
                        </div>
                    )) : (
                        <div className="empty-state glass-panel">
                            <i className="fas fa-inbox"></i>
                            <p>No {activeTab} registered in the system yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

