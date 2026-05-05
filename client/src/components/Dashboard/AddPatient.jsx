import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Toast';
import { SkeletonCard } from '../Skeleton';
import { BASE_URL } from '../../api';
import './Dashboard.css';

const AddPatient = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();
    const user = JSON.parse(localStorage.getItem('user'));

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSearched(true);
        try {
            // Fetch all patients from the system
            const res = await axios.get(`${BASE_URL}/api/users/patients`);
            
            // Filter by 'P' prefix and search query
            let filtered = res.data.filter(u => u.uniqueId?.startsWith('P'));
            
            if (query) {
                const q = query.toLowerCase();
                filtered = filtered.filter(u => 
                    u.name.toLowerCase().includes(q) || 
                    u.uniqueId.toLowerCase().includes(q)
                );
            }
            
            setResults(filtered);
        } catch (err) {
            addToast('Failed to fetch patient directory', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);

    const handleAddToHospital = async (patientId) => {
        try {
            await axios.put(`${BASE_URL}/api/users/profile/${patientId}`, {
                hospitalName: user.hospitalName,
                hospitalLocation: user.hospitalLocation,
                admissionDate: new Date(),
                admittedBy: user.id || user._id
            });
            addToast('Patient successfully admitted to your hospital!', 'success');
            handleSearch();
        } catch (err) {
            addToast('Failed to admit patient', 'error');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <div className="brand-title-area">
                        <button onClick={() => navigate(-1)} className="back-btn-minimal" title="Back">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h2 className="section-title">Admit New Patient</h2>
                    </div>
                    <p className="section-subtitle">Search the global patient directory to officially admit them to your facility.</p>
                </div>
            </header>

            <form onSubmit={handleSearch} className="search-form glass-panel animate-fade-in">
                <div className="search-input-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search patient by name or ID (e.g. P101)..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary">Search</button>
            </form>

            <div className="search-results-container">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : results.length > 0 ? (
                    results.map(u => {
                        const isAlreadyMember = u.hospitalName?.toLowerCase() === user.hospitalName?.toLowerCase();
                        
                        return (
                            <div key={u._id} className="user-row glass-panel animate-slide-up">
                                <div className="user-profile-info">
                                    <div className="user-avatar-mini">
                                        {u.profilePicture ? <img src={u.profilePicture} alt="Avatar" /> : <i className="fas fa-user-injured"></i>}
                                    </div>
                                    <div className="user-details">
                                        <strong>{u.name}</strong>
                                        <span>{u.uniqueId} &bull; Registered Patient</span>
                                        {isAlreadyMember && <span className="status-badge-inline">Admitted to: {u.hospitalName} {u.roomNumber ? `(Room: ${u.roomNumber})` : ''}</span>}
                                    </div>
                                </div>

                                <div className="search-action-btn">
                                    {isAlreadyMember ? (
                                        <button className="btn btn-success btn-sm" disabled>
                                            <i className="fas fa-check-circle"></i> Admitted
                                        </button>
                                    ) : (
                                        <div className="admission-form-mini">
                                            <button className="btn btn-primary btn-sm" onClick={() => handleAddToHospital(u._id)}>
                                                <i className="fas fa-plus"></i> Admit to Hospital
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : searched && (
                    <div className="empty-state glass-panel animate-fade-in">
                        <i className="fas fa-user-slash"></i>
                        <p>No patients found matching your search criteria.</p>
                        <div className="empty-actions">
                            <p className="hint-text">If the patient is not registered in the system yet:</p>
                            <button className="btn btn-primary" onClick={() => navigate('/register', { state: { hospitalName: user?.hospitalName } })}>
                                <i className="fas fa-plus"></i> Register New Patient
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddPatient;
