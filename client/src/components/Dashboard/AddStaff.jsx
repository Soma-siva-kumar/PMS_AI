import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Toast';
import { SkeletonCard } from '../Skeleton';
import './Dashboard.css';

const AddStaff = () => {
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
            // Fetch all staff (caretakers) from the system
            const res = await axios.get('http://localhost:5000/api/users/caretakers');
            
            // Filter by clinical ID prefixes (S for Staff, C for Caretaker) and search query
            let filtered = res.data.filter(u => 
                u.uniqueId?.startsWith('S') || u.uniqueId?.startsWith('C')
            );
            
            if (query) {
                const q = query.toLowerCase();
                filtered = filtered.filter(u => 
                    u.name.toLowerCase().includes(q) || 
                    u.uniqueId.toLowerCase().includes(q)
                );
            }
            
            setResults(filtered);
        } catch (err) {
            addToast('Failed to fetch staff directory', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch();
    }, []);

    const handleAddToHospital = async (staffId) => {
        try {
            // Mocking the update of hospitalName for the staff
            // In a real app, this would be a specific API call to link staff to hospital
            await axios.put(`http://localhost:5000/api/users/profile/${staffId}`, {
                hospitalName: user.hospitalName,
                admissionDate: new Date()
            });
            addToast('Staff successfully added to your hospital!', 'success');
            // Refresh results to show updated status if needed
            handleSearch();
        } catch (err) {
            addToast('Failed to add staff to hospital', 'error');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <h2 className="section-title">Add New Staff</h2>
                    <p className="section-subtitle">Search the global staff directory to add members to your facility.</p>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline">Back to Console</button>
            </header>

            <form onSubmit={handleSearch} className="search-form glass-panel animate-fade-in">
                <div className="search-input-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder="Search staff by name or ID (e.g. S101)..."
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
                                        {u.profilePicture ? <img src={u.profilePicture} alt="Avatar" /> : <i className="fas fa-user-md"></i>}
                                    </div>
                                    <div className="user-details">
                                        <strong>{u.name}</strong>
                                        <span>{u.uniqueId} &bull; Clinical Staff</span>
                                        {isAlreadyMember && <span className="status-badge-inline">In Your Hospital</span>}
                                    </div>
                                </div>

                                <div className="search-action-btn">
                                    {isAlreadyMember ? (
                                        <button className="btn btn-success btn-sm" disabled>
                                            <i className="fas fa-check-circle"></i> Member
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleAddToHospital(u._id)}>
                                            <i className="fas fa-plus"></i> Add to Hospital
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : searched && (
                    <div className="empty-state glass-panel animate-fade-in">
                        <i className="fas fa-user-slash"></i>
                        <p>No staff found matching your search criteria.</p>
                        <div className="empty-actions">
                            <p className="hint-text">If the staff member is not registered in the system yet:</p>
                            <button className="btn btn-primary" onClick={() => navigate('/register')}>
                                <i className="fas fa-user-plus"></i> Register New Staff
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddStaff;
