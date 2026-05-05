import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../Toast';
import { SkeletonCard } from '../Skeleton';
import { BASE_URL } from '../../api';
import './Dashboard.css';

const UserDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [targetUser, setTargetUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMonitoring, setShowMonitoring] = useState(false);
    const [isEditingRoom, setIsEditingRoom] = useState(false);
    const [roomInput, setRoomInput] = useState('');
    const [connectedPeople, setConnectedPeople] = useState([]);
    const [patientSearch, setPatientSearch] = useState('');
    const [patientResults, setPatientResults] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [isAssigning, setIsAssigning] = useState(false);
    const [isEditingAIKey, setIsEditingAIKey] = useState(false);
    const [aiKeyInput, setAIKeyInput] = useState('');
    const [isEditingSource, setIsEditingSource] = useState(false);
    const [sourceTypeInput, setSourceTypeInput] = useState('none');
    const [sourceUrlInput, setSourceUrlInput] = useState('');
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [showAIKey, setShowAIKey] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                
                // Fetch User Profile
                const userRes = await axios.get(`${BASE_URL}/api/users/profile/${id}`);
                setTargetUser(userRes.data);
                setRoomInput(userRes.data.roomNumber || '');

                // Fetch Connections (Assigned Patients or Care Team)
                const connectionsRes = await axios.get(`${BASE_URL}/api/users/connections/${id}`);
                setConnectedPeople(connectionsRes.data);
                setAIKeyInput(userRes.data.aiApiKey || '');
                setSourceTypeInput(userRes.data.aiSourceType || 'none');
                setSourceUrlInput(userRes.data.aiSourceUrl || '');
            } catch (err) {
                console.error('Error fetching details:', err);
                addToast('Failed to load details', 'error');
                navigate('/dashboard/admin');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, addToast, navigate]);

    useEffect(() => {
        const searchPatients = async () => {
            if (patientSearch.length < 2) {
                setPatientResults([]);
                return;
            }
            try {
                const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const res = await axios.get(`${BASE_URL}/api/users/search?query=${patientSearch}&role=Patient`);
                // Filter out already connected patients
                const filtered = res.data.filter(p => !connectedPeople.some(cp => cp._id === p._id));
                setPatientResults(filtered);
            } catch (err) {
                console.error('Error searching patients:', err);
            }
        };
        const timeout = setTimeout(searchPatients, 300);
        return () => clearTimeout(timeout);
    }, [patientSearch, connectedPeople]);

    const handleAssign = async () => {
        if (!selectedPatient) return;
        setIsAssigning(true);
        try {
            await axios.post(`${BASE_URL}/api/users/admin-assign`, {
                staffId: id,
                patientId: selectedPatient._id
            });
            addToast('Assignment request sent to both parties', 'success');
            setSelectedPatient(null);
            setPatientSearch('');
        } catch (err) {
            addToast(err.response?.data?.message || 'Assignment failed', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUpdateRoom = async () => {
        try {
            await axios.put(`${BASE_URL}/api/users/profile/${id}`, {
                roomNumber: roomInput
            });
            setTargetUser({ ...targetUser, roomNumber: roomInput });
            setIsEditingRoom(false);
            addToast('Room number updated successfully!', 'success');
        } catch (err) {
            addToast('Failed to update room number', 'error');
        }
    };

    const handleUpdateAIKey = async () => {
        try {
            await axios.put(`${BASE_URL}/api/users/profile/${id}`, { aiApiKey: aiKeyInput });
            setTargetUser({ ...targetUser, aiApiKey: aiKeyInput });
            setIsEditingAIKey(false);
            addToast('AI API Key updated successfully', 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update AI Key', 'error');
        }
    };

    const handleUpdateSource = async () => {
        try {
            await axios.put(`${BASE_URL}/api/users/profile/${id}`, { 
                aiSourceType: sourceTypeInput,
                aiSourceUrl: sourceUrlInput
            });
            setTargetUser({ ...targetUser, aiSourceType: sourceTypeInput, aiSourceUrl: sourceUrlInput });
            setIsEditingSource(false);
            addToast('Video source updated successfully', 'success');
        } catch (err) {
            addToast('Failed to update video source', 'error');
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingVideo(true);
        const formData = new FormData();
        formData.append('video', file);

        try {
            const res = await axios.post(`${BASE_URL}/api/users/upload-ai-video/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setSourceUrlInput(res.data.url);
            setSourceTypeInput('file');
            setTargetUser({ ...targetUser, aiSourceUrl: res.data.url, aiSourceType: 'file' });
            addToast('Video uploaded successfully!', 'success');
        } catch (err) {
            addToast('Video upload failed', 'error');
        } finally {
            setUploadingVideo(false);
        }
    };

    const handleRemoveFromHospital = async () => {
        if (!window.confirm(`Are you sure you want to remove ${targetUser.name} from your hospital records?`)) return;

        try {
            await axios.put(`${BASE_URL}/api/users/profile/${id}`, {
                hospitalName: '',
                hospitalLocation: '',
                admissionDate: null,
                roomNumber: '',
                admittedBy: null
            });
            addToast(`${isStaff ? 'Staff' : 'Patient'} successfully removed from hospital`, 'success');
            navigate('/dashboard/admin');
        } catch (err) {
            addToast('Failed to remove from hospital', 'error');
        }
    };

    if (loading) return (
        <div className="dashboard-container">
            <SkeletonCard />
        </div>
    );

    if (!targetUser) return null;

    const isStaff = targetUser.role === 'Staff' || targetUser.role === 'Caretaker';
    const admissionLabel = isStaff ? 'Hiring Date' : 'Admission Date';

    return (
        <div className="dashboard-container">
            <header className="dashboard-header animate-fade-in">
                <div className="user-brand">
                    <div className="brand-title-area" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => navigate(-1)} className="back-btn-minimal" title="Back">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h2 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {targetUser.name}
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal', borderLeft: '2px solid var(--border)', paddingLeft: '15px' }}>
                                ID: {targetUser.uniqueId}
                            </span>
                            {!isStaff && (
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal', borderLeft: '2px solid var(--border)', paddingLeft: '15px' }}>
                                    Room: {targetUser.roomNumber || 'Unassigned'}
                                </span>
                            )}
                        </h2>
                    </div>
                </div>
                {!isStaff && (
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate(`/monitor/${targetUser.uniqueId}/live`)}
                        style={{ padding: '12px 24px', borderRadius: '30px', fontWeight: 'bold', boxShadow: '0 4px 15px var(--primary-glow)' }}
                    >
                        <i className="fas fa-video"></i> Live
                    </button>
                )}
            </header>

            <div className="profile-page-wrapper animate-fade-in">
                {/* 1. Clinical Monitoring Suite Card (First Position) */}
                {!isStaff && (
                    <>
                        <div className="profile-card glass-panel animate-slide-up">
                        <div className="clinical-suite">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-eye"></i> AI Monitoring</h3>
                                <span className="ai-last-updated" style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--glass-bright)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    <i className="fas fa-clock"></i> Last Updated: Not yet
                                </span>
                            </div>

                            <div className="ai-metrics-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {/* Saline Bottle Level */}
                                <div 
                                    className="metric-row clickable-card" 
                                    onClick={() => navigate(`/monitor/${targetUser.uniqueId}/saline`)}
                                    style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                            <i className="fas fa-prescription-bottle-alt" style={{ color: '#00d2ff' }}></i> Saline bottle level detection
                                        </h4>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ flex: 1, background: 'var(--border)', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{ width: '0%', height: '100%', background: '#00d2ff', transition: 'width 0.5s ease' }}></div>
                                        </div>
                                        <span style={{ fontWeight: 'bold', minWidth: '45px', fontSize: '1.1rem', color: '#00d2ff' }}>0%</span>
                                    </div>
                                </div>

                                {/* Patient Posture */}
                                <div 
                                    className="metric-row clickable-card" 
                                    onClick={() => navigate(`/monitor/${targetUser.uniqueId}/posture`)}
                                    style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                            <i className="fas fa-bed" style={{ color: '#a29bfe' }}></i> Patient posture Detection
                                        </h4>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-muted)' }}>Not detected yet</div>
                                    </div>
                                </div>

                                {/* Hand gesture detection */}
                                <div 
                                    className="metric-row clickable-card" 
                                    onClick={() => navigate(`/monitor/${targetUser.uniqueId}/gestures`)}
                                    style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                            <i className="fas fa-hand-paper" style={{ color: '#55efc4' }}></i> Hand gesture detection
                                        </h4>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#55efc4' }}>No</div>
                                    </div>
                                </div>

                                {/* Unknown Person Detection */}
                                <div 
                                    className="metric-row clickable-card" 
                                    onClick={() => navigate(`/monitor/${targetUser.uniqueId}/unknown`)}
                                    style={{ background: 'var(--glass-bright)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
                                            <i className="fas fa-user-secret" style={{ color: '#ff7675' }}></i> Unknown Person Detection
                                        </h4>
                                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#ff7675' }}>No</div>
                                    </div>
                                </div>

                                {/* AI Connection Key Card - Premium */}
                                <div className="ai-config-card" style={{ 
                                    marginTop: '12px', 
                                    padding: '20px', 
                                    background: 'rgba(0, 210, 255, 0.04)', 
                                    borderRadius: '16px', 
                                    border: '1px solid rgba(0, 210, 255, 0.15)',
                                    boxShadow: '0 8px 32px 0 rgba(0, 210, 255, 0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <i className="fas fa-shield-alt"></i> AI Connection Key
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {targetUser.aiApiKey && (
                                                <>
                                                    <button 
                                                        className="edit-room-btn" 
                                                        onClick={() => setShowAIKey(!showAIKey)} 
                                                        style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                                                        title={showAIKey ? "Hide Key" : "Show Key"}
                                                    >
                                                        <i className={showAIKey ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                                    </button>
                                                    <button 
                                                        className="edit-room-btn" 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(targetUser.aiApiKey);
                                                            addToast('Key copied to clipboard!', 'success');
                                                        }} 
                                                        style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)' }}
                                                        title="Copy Key"
                                                    >
                                                        <i className="fas fa-copy"></i>
                                                    </button>
                                                </>
                                            )}
                                            {!isEditingAIKey && (
                                                <button className="edit-room-btn" onClick={() => setIsEditingAIKey(true)} style={{ fontSize: '0.75rem' }}>
                                                    <i className="fas fa-edit"></i> Edit
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                        {isEditingAIKey ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <input 
                                                    type="text" 
                                                    value={aiKeyInput} 
                                                    onChange={(e) => setAIKeyInput(e.target.value)}
                                                    placeholder="Enter secret AI API key"
                                                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--text-main)', fontFamily: 'monospace' }}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button className="btn btn-primary btn-xs" style={{ flex: 1 }} onClick={handleUpdateAIKey}>Save Key</button>
                                                    <button className="btn btn-outline btn-xs" style={{ flex: 1 }} onClick={() => { setIsEditingAIKey(false); setAIKeyInput(targetUser.aiApiKey || ''); }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p style={{ 
                                                margin: 0, 
                                                fontSize: '0.95rem', 
                                                fontFamily: 'monospace', 
                                                color: 'var(--text-main)', 
                                                letterSpacing: showAIKey ? '1px' : '3px',
                                                opacity: targetUser.aiApiKey ? 1 : 0.3
                                            }}>
                                                {targetUser.aiApiKey ? (showAIKey ? targetUser.aiApiKey : '••••••••••••••••') : 'NO_KEY_CONFIGURED'}
                                            </p>
                                        )}
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        <i className="fas fa-info-circle"></i> Provide this key to the external AI Engine.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Dedicated Video Feed Source Card - Admin */}
                    <div className="profile-card glass-panel animate-slide-up" style={{ animationDelay: '0.15s' }}>
                        <div className="clinical-suite">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-video"></i> Video Source Management</h3>
                                {!isEditingSource && (
                                    <button className="edit-room-btn" onClick={() => setIsEditingSource(true)}>
                                        <i className="fas fa-edit"></i> Edit Source
                                    </button>
                                )}
                            </div>

                            <div className="ai-config-card" style={{ 
                                padding: '20px', 
                                background: 'rgba(255, 255, 255, 0.04)', 
                                borderRadius: '16px', 
                                border: '1px solid rgba(255, 255, 255, 0.1)' 
                            }}>
                                {isEditingSource ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setSourceTypeInput('file');
                                                    fileInputRef.current?.click();
                                                }}
                                                style={{ 
                                                    padding: '12px 5px', 
                                                    borderRadius: '12px', 
                                                    border: sourceTypeInput === 'file' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: sourceTypeInput === 'file' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                    color: sourceTypeInput === 'file' ? '#00d2ff' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {uploadingVideo ? (
                                                    <i className="fas fa-spinner fa-spin" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                ) : (
                                                    <i className="fas fa-file-video" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                )}
                                                Local Video
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                style={{ display: 'none' }} 
                                                accept="video/*" 
                                                onChange={handleVideoUpload} 
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setSourceTypeInput('mobile')}
                                                style={{ 
                                                    padding: '12px 5px', 
                                                    borderRadius: '12px', 
                                                    border: sourceTypeInput === 'mobile' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: sourceTypeInput === 'mobile' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                    color: sourceTypeInput === 'mobile' ? '#00d2ff' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <i className="fas fa-mobile-alt" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                Mobile Cam
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setSourceTypeInput('cctv')}
                                                style={{ 
                                                    padding: '12px 5px', 
                                                    borderRadius: '12px', 
                                                    border: sourceTypeInput === 'cctv' ? '2px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: sourceTypeInput === 'cctv' ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
                                                    color: sourceTypeInput === 'cctv' ? '#00d2ff' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                <i className="fas fa-video" style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}></i>
                                                CCTV Cam
                                            </button>
                                        </div>

                                        {sourceTypeInput !== 'none' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {sourceTypeInput === 'file' ? (
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <input 
                                                            type="text" 
                                                            value={sourceUrlInput} 
                                                            readOnly
                                                            placeholder="Video URL"
                                                            style={{ flex: 1, padding: '12px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'default' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div style={{ position: 'relative' }}>
                                                        <i className={sourceTypeInput === 'mobile' ? "fas fa-mobile-alt" : "fas fa-video"} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#00d2ff' }}></i>
                                                        <input 
                                                            type="text" 
                                                            value={sourceUrlInput} 
                                                            onChange={(e) => setSourceUrlInput(e.target.value)}
                                                            placeholder={sourceTypeInput === 'mobile' ? "http:// IP Address" : "rtsp:// URL"}
                                                            style={{ width: '100%', padding: '12px 15px 12px 40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button className="btn btn-primary btn-sm" onClick={handleUpdateSource} style={{ flex: 1 }}>Save Source</button>
                                            <button className="btn btn-outline btn-sm" onClick={() => { setIsEditingSource(false); setSourceTypeInput(targetUser.aiSourceType || 'none'); setSourceUrlInput(targetUser.aiSourceUrl || ''); }} style={{ flex: 1 }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{ width: '45px', height: '45px', borderRadius: '10px', background: 'rgba(0, 210, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d2ff' }}>
                                                <i className={targetUser.aiSourceType === 'file' ? 'fas fa-file-video' : targetUser.aiSourceType === 'mobile' ? 'fas fa-mobile-alt' : targetUser.aiSourceType === 'cctv' ? 'fas fa-video' : 'fas fa-video-slash'}></i>
                                            </div>
                                            <div>
                                                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>
                                                    {targetUser.aiSourceType === 'file' ? 'Local Demo Video' : 
                                                     targetUser.aiSourceType === 'mobile' ? 'Mobile IP Cam' : 
                                                     targetUser.aiSourceType === 'cctv' ? 'Professional CCTV' : 'Not Configured'}
                                                </h5>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{targetUser.aiSourceUrl || 'No source linked'}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    </>
                )}

                {/* 1. Assign Patient Card (Staff Only) */}
                {isStaff && (
                    <div className="profile-card glass-panel animate-slide-up" style={{ marginBottom: '25px' }}>
                        <div className="section-title-group" style={{ marginBottom: '20px' }}>
                            <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-user-plus"></i> Assign Patient</h3>
                            <p className="section-subtitle">Search and assign patients to {targetUser.name}</p>
                        </div>

                        <div className="search-bar-container" style={{ position: 'relative', marginBottom: '15px' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
                            <input 
                                type="text" 
                                value={patientSearch}
                                onChange={(e) => setPatientSearch(e.target.value)}
                                placeholder="Search patients by name or ID..." 
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', fontSize: '1rem' }}
                            />
                        </div>

                        {/* Search Results */}
                        {patientResults.length > 0 && !selectedPatient && (
                            <div className="search-results-mini glass-panel" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '15px', padding: '10px' }}>
                                {patientResults.map(p => (
                                    <div key={p._id} className="search-result-item" onClick={() => setSelectedPatient(p)} style={{ padding: '10px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="avatar-xs" style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                                            <i className="fas fa-user-injured"></i>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.uniqueId}</div>
                                        </div>
                                        <i className="fas fa-plus-circle" style={{ color: 'var(--primary)' }}></i>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Selected Patient Preview */}
                        {selectedPatient && (
                            <div className="selected-preview glass-panel" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(0, 210, 255, 0.05)', border: '1px solid var(--primary)', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                        <i className="fas fa-user-injured"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1rem' }}>{selectedPatient.name}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {selectedPatient.uniqueId}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-primary btn-sm" onClick={handleAssign} disabled={isAssigning}>
                                        {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                                    </button>
                                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedPatient(null)} disabled={isAssigning}>Cancel</button>
                                </div>
                            </div>
                        )}

                        <p className="hint-text" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            <i className="fas fa-info-circle"></i> Once confirmed, a connection request will be sent to both the staff and the patient. Connection will be established only after both parties accept.
                        </p>
                    </div>
                )}
                {isStaff && (
                    <div className="profile-card glass-panel animate-slide-up" style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-user-injured"></i> Assigned Patients</h3>
                            <button className="icon-btn-sm tooltip" onClick={() => {
                                window.print();
                                addToast('Exporting patient list...', 'success');
                            }} title="Export List" style={{ width: '32px', height: '32px', padding: 0, fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-main)' }}>
                                <i className="fas fa-file-export"></i>
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {connectedPeople.length === 0 ? (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-procedures" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No patients assigned to this staff member yet.</p>
                                </div>
                            ) : (
                                <div className="caretaker-list chat-style-list">
                                    {connectedPeople.map(p => (
                                        <div key={p._id || p.id} className="chat-row glass-panel" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/admin/user/${p._id || p.id}`)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="chat-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                                                    {p.profilePicture ? <img src={p.profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fas fa-user-injured"></i>}
                                                </div>
                                                <div className="chat-info">
                                                    <div className="chat-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                                        <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                                                        <span className="chat-id" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '8px' }}>{p.uniqueId}</span>
                                                    </div>
                                                    <p className="chat-subtitle" style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>Room: {p.roomNumber || 'Unassigned'}</p>
                                                </div>
                                            </div>
                                            <div className="chat-action" onClick={(e) => e.stopPropagation()}>
                                                <button className="icon-btn-sm tooltip" onClick={() => navigate(`/monitor/${p._id || p.id}`)} title="View Live Feed">
                                                    <i className="fas fa-video"></i>
                                                </button>
                                                <button className="icon-btn-sm tooltip" onClick={() => navigate(`/dashboard/admin/user/${p._id || p.id}`)} title="View Profile">
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Connected People Card for Patients */}
                {!isStaff && (
                    <div className="profile-card glass-panel animate-slide-up" style={{ animationDelay: '0.05s', marginTop: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="suite-title" style={{ marginBottom: 0 }}><i className="fas fa-network-wired"></i> Connected Care Team</h3>
                            <span style={{ fontSize: '0.8rem', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', padding: '4px 10px', borderRadius: '15px', border: '1px solid rgba(0,210,255,0.3)' }}>
                                {connectedPeople.length} Total Connections
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {connectedPeople.length === 0 ? (
                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <i className="fas fa-user-slash" style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }}></i>
                                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No active connections for this patient yet.</p>
                                </div>
                            ) : (
                                <div className="caretaker-list chat-style-list">
                                    {connectedPeople.map(person => (
                                        <div key={person._id || person.id} className="chat-row glass-panel" style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => navigate(`/dashboard/admin/user/${person._id || person.id}`)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="chat-avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', overflow: 'hidden' }}>
                                                    {person.profilePicture ? <img src={person.profilePicture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className={`fas ${person.role === 'Staff' ? 'fa-user-md' : 'fa-user'}`}></i>}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-main)' }}>{person.name}</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary)' }}>{person.role}</p>
                                                </div>
                                            </div>
                                            <div className="chat-action">
                                                <button className="icon-btn-sm tooltip" title="View Profile">
                                                    <i className="fas fa-chevron-right"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. Combined Identity & Records Card */}
                <div className="profile-card glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="profile-header-section">
                        <div className="profile-avatar-container">
                            <div className="profile-avatar-large">
                                {targetUser.profilePicture ? (
                                    <img src={targetUser.profilePicture} alt="Avatar" />
                                ) : (
                                    <i className={`fas ${isStaff ? 'fa-user-md' : 'fa-user-injured'}`}></i>
                                )}
                            </div>
                        </div>

                        <div className="profile-identity">
                            <h1>{targetUser.name}</h1>
                            <div className="identity-badges">
                                <span className="role-badge">{targetUser.role}</span>
                                <span className="id-badge">ID: {targetUser.uniqueId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile-form">
                        <h3 className="suite-title" style={{ marginBottom: '15px' }}>
                            <i className="fas fa-info-circle"></i> Official Records
                        </h3>
                        <div className="profile-form-grid">
                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-envelope"></i> Email Address</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.email}</p>
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-phone"></i> Phone Number</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.phoneNumber || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-calendar-alt"></i> {admissionLabel}</label>
                                <div className="profile-value-box">
                                    <p className="static-value">
                                        {targetUser.admissionDate 
                                            ? new Date(targetUser.admissionDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) 
                                            : 'Record not dated'}
                                    </p>
                                </div>
                            </div>

                            {!isStaff && (
                                <div className="form-group profile-group">
                                    <label className="profile-label">
                                        <i className="fas fa-door-open"></i> Assigned Room
                                        {!isEditingRoom && (
                                            <button className="edit-room-btn" onClick={() => setIsEditingRoom(true)}>
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                        )}
                                    </label>
                                    <div className="profile-value-box">
                                        {isEditingRoom ? (
                                            <div className="room-edit-input-group">
                                                <input 
                                                    type="text" 
                                                    value={roomInput} 
                                                    onChange={(e) => setRoomInput(e.target.value)}
                                                    placeholder="Enter room number"
                                                    autoFocus
                                                />
                                                <button className="btn btn-primary btn-xs" onClick={handleUpdateRoom}>Save</button>
                                                <button className="btn btn-outline btn-xs" onClick={() => { setIsEditingRoom(false); setRoomInput(targetUser.roomNumber || ''); }}>Cancel</button>
                                            </div>
                                        ) : (
                                            <p className="static-value">{targetUser.roomNumber || 'Not assigned'}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="form-group profile-group">
                                <label className="profile-label"><i className="fas fa-hospital"></i> Connected Facility</label>
                                <div className="profile-value-box">
                                    <p className="static-value">{targetUser.hospitalName || 'Unassigned'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="profile-footer-actions">
                            <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '6px 12px', fontSize: '0.8rem', minWidth: 'auto' }}>
                                <i className="fas fa-print"></i> Export
                            </button>
                            {isStaff ? (
                                <>
                                    <button className="btn btn-outline" onClick={() => addToast('Shift management coming soon!', 'info')}>
                                        <i className="fas fa-calendar-check"></i> Manage Shifts
                                    </button>
                                    <button className="btn btn-danger-outline" onClick={handleRemoveFromHospital}>
                                        <i className="fas fa-user-minus"></i> Remove
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="btn btn-success" onClick={() => setShowMonitoring(true)}>
                                        <i className="fas fa-plug"></i> Connect for Monitoring
                                    </button>
                                    <button className="btn btn-danger-outline" onClick={handleRemoveFromHospital}>
                                        <i className="fas fa-hospital-user"></i> Remove
                                    </button>
                                </>
                            )}
                        </div>

                        {showMonitoring && (
                            <div className="monitoring-overlay animate-fade-in" onClick={() => setShowMonitoring(false)}>
                                <div className="source-selector-card glass-panel animate-zoom-in" onClick={e => e.stopPropagation()}>
                                    <div className="selector-header">
                                        <h3>Select Video Source</h3>
                                        <button className="close-selector" onClick={() => setShowMonitoring(false)}>&times;</button>
                                    </div>
                                    <div className="source-grid">
                                        <div className="source-option" onClick={() => { addToast('Connecting to CCTV...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-video"></i>
                                            <span>CCTV Feed</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Waiting for Mobile Link...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-mobile-alt"></i>
                                            <span>Mobile Cam</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Initializing System Cam...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-laptop"></i>
                                            <span>System Cam</span>
                                        </div>
                                        <div className="source-option" onClick={() => { addToast('Opening File Browser...', 'info'); setShowMonitoring(false); }}>
                                            <i className="fas fa-upload"></i>
                                            <span>Upload Video</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetail;
