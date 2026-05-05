import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from './Toast';
import { SkeletonCard } from './Skeleton';
import { BASE_URL } from '../api';
import './Dashboard/Dashboard.css';

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [error, setError] = useState('');
    const user = JSON.parse(localStorage.getItem('user'));

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError('');
        setSearched(true);
        try {
            if (isAdmin) {
                // Admin can see everyone
                const [ctRes, ptRes] = await Promise.all([
                    axios.get(`${BASE_URL}/api/users/caretakers`),
                    axios.get(`${BASE_URL}/api/users/patients`)
                ]);
                
                let combined = [...ctRes.data, ...ptRes.data];
                
                // Filter to only show official hospital members
                combined = combined.filter(u => 
                    (u.uniqueId?.startsWith('S') || u.uniqueId?.startsWith('P'))
                );

                if (query) {
                    const q = query.toLowerCase();
                    combined = combined.filter(u => 
                        u.name.toLowerCase().includes(q) || 
                        u.uniqueId.toLowerCase().includes(q) ||
                        u.role.toLowerCase().includes(q)
                    );
                }
                setResults(combined);
                if (combined.length === 0) setError('No hospital records found.');
            } else {
                let url = `${BASE_URL}/api/users/search?query=${query}&currentUserId=${user.id}`;
                
                if (user?.role === 'Patient') {
                    // Patients can search for everyone EXCEPT other patients
                    url += `&excludeRole=Patient`;
                } else {
                    // Staff/Caretakers/Family search for Patients
                    url += `&role=Patient`;
                }

                const res = await axios.get(url);
                setResults(res.data);
                if (res.data.length === 0) setError('No matching care providers or patients found.');
            }
        } catch (err) {
            setError('Search failed. Please try again.');
            addToast('Search failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) handleSearch();
    }, []);

    const handleConnect = async (targetId) => {
        try {
            await axios.post(`${BASE_URL}/api/users/connect`, {
                senderId: user.id,
                recipientId: targetId
            });
            setResults(results.map(r => r._id === targetId ? { ...r, connectionStatus: 'pending' } : r));
            addToast('Connection request sent!', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Connection failed', 'error');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <h2 className="section-title">{isAdmin ? 'Hospital Directory' : 'Connect & Supervise'}</h2>
                    <p className="section-subtitle">
                        {isAdmin ? 'Search and manage all official staff and patients.' : 
                         user?.role === 'Patient' ? 'Search for Staff, Caretakers, or Family Members.' : 'Search for Patients to supervise.'}
                    </p>
                </div>
                <button onClick={() => navigate(-1)} className="btn btn-outline">Back</button>
            </header>

            <form onSubmit={handleSearch} className="search-form glass-panel animate-fade-in">
                <div className="search-input-wrapper">
                    <i className="fas fa-search"></i>
                    <input
                        type="text"
                        placeholder={isAdmin ? 'Search by name, ID, or role...' : 
                                     user?.role === 'Patient' ? 'Search by name, ID (e.g. S1, C1, F1)...' : 'Search patient by name or ID...'}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Search'}
                </button>
            </form>

            <div className="search-results-container">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : results.length > 0 ? (
                    results.map(u => (
                        <div key={u._id} className="patient-row glass-panel animate-slide-up">
                            <div className="user-profile-info">
                                <div className="user-avatar-mini">
                                    {u.profilePicture ? <img src={u.profilePicture} alt="Avatar" /> : <i className="fas fa-user-circle"></i>}
                                </div>
                                <div className="user-details">
                                    <strong>{u.name}</strong>
                                    <span>{u.uniqueId} &bull; {u.role}</span>
                                    {u.hospitalName && (
                                        <div className="hospital-info-mini">
                                            <i className="fas fa-hospital"></i> {u.hospitalName} {u.hospitalLocation && `| ${u.hospitalLocation}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {!isAdmin && (
                                <div className="search-action-btn">
                                    {u.connectionStatus === 'pending' ? (
                                        <button className="btn btn-outline btn-sm" disabled>
                                            <i className="fas fa-clock"></i> Requested
                                        </button>
                                    ) : u.connectionStatus === 'accepted' ? (
                                        <button className="btn btn-success btn-sm" disabled>
                                            <i className="fas fa-check-circle"></i> Connected
                                        </button>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleConnect(u._id)}>
                                            <i className="fas fa-user-plus"></i> Connect
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                ) : searched && error ? (
                    <div className="empty-state glass-panel animate-fade-in">
                        <i className="fas fa-search-minus"></i>
                        <p className="error-msg">{error}</p>
                    </div>
                ) : searched && !loading ? (
                    <div className="empty-state glass-panel animate-fade-in">
                        <i className="fas fa-search-minus"></i>
                        <p>No matches found for &ldquo;{query}&rdquo;</p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Search;

