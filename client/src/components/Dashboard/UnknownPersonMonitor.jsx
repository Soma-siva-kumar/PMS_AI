import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';

const UnknownPersonMonitor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [detected, setDetected] = useState(null); // null = waiting, true/false after first update
    const [patient, setPatient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState([]);
    const [knownPersons, setKnownPersons] = useState([]);
    const [newName, setNewName] = useState('');
    const [newPhoto, setNewPhoto] = useState(null);
    const [newPhotoPreview, setNewPhotoPreview] = useState(null);
    const fileInputRef = useRef();
    const socketRef = useRef();

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewPhoto(reader.result);
            setNewPhotoPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleAddKnownPerson = () => {
        if (!newName.trim()) { addToast('Please enter a name', 'error'); return; }
        if (!newPhoto) { addToast('Please select a photo', 'error'); return; }
        setKnownPersons(prev => [
            { name: newName.trim(), photo: newPhoto, time: new Date().toLocaleString() },
            ...prev
        ]);
        setNewName('');
        setNewPhoto(null);
        setNewPhotoPreview(null);
        fileInputRef.current.value = '';
        addToast(`${newName.trim()} added to known persons`, 'success');
    };

    const handleRemoveKnown = (index) => {
        setKnownPersons(prev => prev.filter((_, i) => i !== index));
        addToast('Person removed', 'info');
    };

    useEffect(() => {

        const fetchPatient = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/users/patients`);
                const found = res.data.find(p => p.uniqueId === id);
                if (found) setPatient(found);
            } catch (err) {
                addToast('Failed to load patient info', 'error');
            }
        };
        fetchPatient();

        socketRef.current = io(BASE_URL);
        socketRef.current.on('connect', () => {
            setConnected(true);
            socketRef.current.emit('join-patient-room', id);
        });

        socketRef.current.on('unknown-person', (data) => {
            const isDetected = data.detected === true || data.detected === 'Yes';
            setDetected(isDetected);

            if (isDetected) {
                addToast('⚠️ ALERT: Unknown person detected near patient!', 'error');
                setHistory(prev => [
                    { photo: data.photo || null, time: new Date().toLocaleString() },
                    ...prev
                ].slice(0, 20));
            }
        });

        socketRef.current.on('disconnect', () => setConnected(false));
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [id, addToast]);
    const exportHistoryJSON = () => {
        const dataToExport = history.length > 0 ? history : [{ time: new Date().toLocaleTimeString(), detected: detected !== null ? detected : false, image: "No image available yet", note: "Initial Snapshot" }];
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unknown-person-history-${new Date().getTime()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ padding: '30px', minHeight: '100vh', background: 'var(--bg-dark)', color: 'var(--text-main)' }}>
            {/* Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'var(--glass)', border: '1px solid var(--border)', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', color: 'var(--text-main)', fontSize: '1rem' }}>
                        <i className="fas fa-chevron-left"></i>
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Unknown Person Detection</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{patient?.name || 'Loading...'} | ID: {id}</p>
                    </div>
                </div>
                <div style={{ padding: '10px 20px', borderRadius: '50px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass)', border: `1px solid ${connected ? '#00ff8844' : '#ffa50044'}`, color: connected ? '#00ff88' : '#ffa500' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor', display: 'inline-block' }}></span>
                    {connected ? 'Live Data Active' : 'Connecting AI...'}
                </div>
            </header>

            <div className="ai-monitor-row">

                {/* Current Status Card */}
                <div className="ai-monitor-card" style={{
                    padding: '60px 30px',
                    borderRadius: '20px',
                    border: `2px solid ${detected === true ? '#ff4d4d' : detected === false ? '#55efc4' : 'var(--border)'}`,
                    background: detected === true ? 'rgba(255,77,77,0.08)' : detected === false ? 'rgba(85,239,196,0.05)' : 'rgba(255,255,255,0.03)',
                    textAlign: 'center',
                    transition: 'all 0.5s ease',
                    boxShadow: detected === true ? '0 0 50px rgba(255,77,77,0.3)' : 'none',
                    animation: detected === true ? 'alert-pulse 1.2s infinite alternate' : 'none',
                }}>
                    {detected === null ? (
                        <>
                            <i className="fas fa-satellite-dish" style={{ fontSize: '4.5rem', color: 'var(--text-muted)', marginBottom: '25px', display: 'block' }}></i>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Awaiting AI Inference</p>
                        </>
                    ) : (
                        <>
                            {detected === true && (
                                <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,77,77,0.2)', borderRadius: '12px', border: '1px solid #ff4d4d', fontWeight: '700', color: '#ff4d4d', fontSize: '1.1rem', letterSpacing: '1px' }}>
                                    ⚠️ SECURITY ALERT — UNKNOWN PERSON DETECTED
                                </div>
                            )}
                            <i
                                className="fas fa-user-secret"
                                style={{
                                    fontSize: '5rem',
                                    color: detected ? '#ff4d4d' : '#55efc4',
                                    marginBottom: '25px',
                                    display: 'block',
                                    filter: detected ? 'drop-shadow(0 0 25px #ff4d4d)' : 'none',
                                }}
                            ></i>
                            <p style={{ margin: '0 0 10px 0', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Unknown Person Detected?</p>
                            <h1 style={{ margin: 0, fontSize: '3.5rem', fontWeight: '800', color: detected ? '#ff4d4d' : '#55efc4', textShadow: detected ? '0 0 20px #ff4d4d88' : 'none' }}>
                                {detected ? 'Yes' : 'No'}
                            </h1>
                        </>
                    )}
                </div>

                {/* Previous Records */}
                <div className="ai-monitor-card" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '20px', padding: '25px', minWidth: '380px', flex: '1 0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fas fa-history"></i> Previous Detections
                            {history.length > 0 && (
                                <span style={{ background: 'rgba(255,77,77,0.15)', color: '#ff4d4d', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(255,77,77,0.3)' }}>
                                    {history.length} alert{history.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </h3>
                        <button onClick={exportHistoryJSON} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.4)', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <i className="fas fa-file-export"></i> Export
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '500px', overflowY: 'auto' }}>
                        {history.map((h, i) => (
                            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,77,77,0.3)', background: 'rgba(255,77,77,0.05)' }}>
                                {/* Photo area */}
                                {h.photo ? (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={h.photo}
                                            alt="Unknown person"
                                            style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }}
                                        />
                                        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,77,77,0.85)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '1px' }}>
                                            ⚠️ UNKNOWN PERSON
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ height: '120px', background: 'rgba(255,77,77,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <i className="fas fa-user-secret" style={{ fontSize: '2.5rem', color: '#ff4d4d' }}></i>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>No photo captured</p>
                                    </div>
                                )}

                                {/* Info row */}
                                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '700', color: '#ff4d4d', fontSize: '0.95rem' }}>Unknown Person Detected</p>
                                        <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{h.time}</p>
                                    </div>
                                    {h.photo && (
                                        <a
                                            href={h.photo}
                                            download={`unknown_person_${i + 1}_${Date.now()}.jpg`}
                                            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-main)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600', transition: 'all 0.2s' }}
                                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                        >
                                            <i className="fas fa-download" style={{ color: '#55efc4' }}></i> Save Image
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}

                        {history.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <i className="fas fa-shield-alt" style={{ fontSize: '3rem', color: '#55efc4', marginBottom: '15px', display: 'block' }}></i>
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No unknown persons detected. Area is secure.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Known Persons Card */}
                <div className="ai-monitor-card" style={{ background: 'var(--glass)', border: '1px solid rgba(85,239,196,0.3)', borderRadius: '20px', padding: '25px', minWidth: '400px', flex: '1 0 auto' }}>
                    <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#55efc4' }}>
                        <i className="fas fa-user-check"></i> Known Persons
                        {knownPersons.length > 0 && (
                            <span style={{ marginLeft: 'auto', background: 'rgba(85,239,196,0.15)', color: '#55efc4', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(85,239,196,0.3)' }}>
                                {knownPersons.length} registered
                            </span>
                        )}
                    </h3>

                    {/* Upload Form */}
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '25px', padding: '20px', background: 'rgba(85,239,196,0.05)', borderRadius: '14px', border: '1px solid rgba(85,239,196,0.1)' }}>
                        {/* Photo preview */}
                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', border: '2px dashed rgba(85,239,196,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(85,239,196,0.05)', flexShrink: 0 }}
                        >
                            {newPhotoPreview ? (
                                <img src={newPhotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <i className="fas fa-camera" style={{ fontSize: '1.5rem', color: '#55efc4' }}></i>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />

                        {/* Name input */}
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Full Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddKnownPerson()}
                                placeholder="e.g. Dr. Siva Kumar"
                                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                            />
                        </div>

                        <button onClick={handleAddKnownPerson} className="btn btn-primary" style={{ padding: '10px 22px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <i className="fas fa-plus"></i> Add
                        </button>
                    </div>

                    {/* Known persons list */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                        {knownPersons.map((p, i) => (
                            <div key={i} style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(85,239,196,0.2)', background: 'rgba(85,239,196,0.04)', position: 'relative' }}>
                                <img src={p.photo} alt={p.name} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                                <button
                                    onClick={() => handleRemoveKnown(i)}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(255,77,77,0.85)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Remove"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                                <div style={{ padding: '12px' }}>
                                    <p style={{ margin: 0, fontWeight: '700', color: '#55efc4', fontSize: '0.95rem' }}>{p.name}</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Added: {p.time}</p>
                                </div>
                            </div>
                        ))}
                        {knownPersons.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No known persons registered yet. Upload photos above.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .ai-monitor-row {
                    display: flex;
                    flex-direction: row;
                    gap: 25px;
                    overflow-x: auto;
                    align-items: flex-start;
                    padding-bottom: 10px;
                }
                .ai-monitor-card {
                    flex: 0 0 auto;
                    min-width: 320px;
                }
                @media (max-width: 768px) {
                    .ai-monitor-row {
                        flex-direction: column;
                        overflow-x: visible;
                    }
                    .ai-monitor-card {
                        min-width: unset;
                        width: 100%;
                    }
                }
            `}</style>
        </div>
    );
};

export default UnknownPersonMonitor;
