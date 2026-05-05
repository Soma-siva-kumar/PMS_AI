import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { useToast } from '../Toast';
import { BASE_URL } from '../../api';

const POSTURES = {
    'Sitting':      { icon: 'fa-chair',          color: '#00d2ff', bg: 'rgba(0,210,255,0.1)' },
    'Standing':     { icon: 'fa-male',            color: '#55efc4', bg: 'rgba(85,239,196,0.1)' },
    'Lying Down':   { icon: 'fa-bed',             color: '#a29bfe', bg: 'rgba(162,155,254,0.1)' },
    'Walking':      { icon: 'fa-walking',          color: '#fdcb6e', bg: 'rgba(253,203,110,0.1)' },
    'Fell Down':    { icon: 'fa-exclamation-triangle', color: '#ff4d4d', bg: 'rgba(255,77,77,0.15)' },
    'Not detected yet': { icon: 'fa-question-circle', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' },
};

const PostureMonitor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [posture, setPosture] = useState('Not detected yet');
    const [patient, setPatient] = useState(null);
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState([]);
    const socketRef = useRef();
    const alarmPlayedRef = useRef(false);

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

        socketRef.current.on('posture-update', (data) => {
            const detected = data.posture || 'Not detected yet';
            setPosture(detected);
            setHistory(prev => [
                { posture: detected, time: new Date().toLocaleString() },
                ...prev
            ].slice(0, 20));

            if (detected === 'Fell Down') {
                addToast('🚨 EMERGENCY: Patient has FELL DOWN! Immediate attention required!', 'error');
                alarmPlayedRef.current = true;
            }
        });

        socketRef.current.on('disconnect', () => setConnected(false));
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [id, addToast]);

    const info = POSTURES[posture] || POSTURES['Not detected yet'];
    const isFell = posture === 'Fell Down';

    const exportHistoryJSON = () => {
        const dataToExport = history.length > 0 ? history : [{ time: new Date().toLocaleTimeString(), posture: posture, note: "Initial Snapshot" }];
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `posture-history-${new Date().getTime()}.json`;
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
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Patient Posture Detection</h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>{patient?.name || 'Loading...'} | ID: {id}</p>
                    </div>
                </div>
                <div style={{ padding: '10px 20px', borderRadius: '50px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--glass)', border: `1px solid ${connected ? '#00ff8844' : '#ffa50044'}`, color: connected ? '#00ff88' : '#ffa500' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 10px currentColor', display: 'inline-block' }}></span>
                    {connected ? 'Live Data Active' : 'Connecting AI...'}
                </div>
            </header>

            <div className="ai-monitor-row">

                    {/* Current Posture Card */}
                    <div className="ai-monitor-card" style={{
                        padding: '50px 30px',
                        borderRadius: '20px',
                        border: `2px solid ${info.color}`,
                        background: info.bg,
                        textAlign: 'center',
                        transition: 'all 0.5s ease',
                        boxShadow: isFell ? `0 0 40px ${info.color}66` : 'none',
                        animation: isFell ? 'fell-pulse 1s infinite alternate' : 'none',
                        minWidth: '320px',
                        flex: '0 0 auto',
                    }}>
                        {isFell && (
                            <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(255,77,77,0.2)', borderRadius: '12px', border: '1px solid #ff4d4d', fontWeight: '700', color: '#ff4d4d', fontSize: '1.1rem', letterSpacing: '1px' }}>
                                🚨 EMERGENCY ALERT — PATIENT FELL DOWN
                            </div>
                        )}
                        <i className={`fas ${info.icon}`} style={{ fontSize: '5rem', color: info.color, marginBottom: '25px', display: 'block', filter: `drop-shadow(0 0 20px ${info.color})` }}></i>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Posture</p>
                        <h1 style={{ margin: 0, fontSize: '2.8rem', fontWeight: '800', color: info.color, textShadow: `0 0 20px ${info.color}88` }}>
                            {posture}
                        </h1>
                    </div>

                    {/* Posture Legend */}
                    <div className="ai-monitor-card" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '16px', padding: '25px', minWidth: '320px', flex: '0 0 auto' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0' }}>
                            <i className="fas fa-info-circle"></i> Posture Reference
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.entries(POSTURES).filter(([k]) => k !== 'Not detected yet').map(([name, meta]) => (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: posture === name ? meta.bg : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid ${posture === name ? meta.color : 'transparent'}`, transition: 'all 0.3s' }}>
                                    <i className={`fas ${meta.icon}`} style={{ color: meta.color, width: '20px', textAlign: 'center' }}></i>
                                    <span style={{ fontSize: '0.9rem', fontWeight: posture === name ? '700' : '400' }}>{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Previous Records */}
                    <div className="ai-monitor-card" style={{ background: 'var(--glass)', border: '1px solid var(--border)', borderRadius: '20px', padding: '25px', minWidth: '360px', flex: '1 0 auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-history"></i> Previous Records
                            </h3>
                            <button onClick={exportHistoryJSON} style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.4)', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                                <i className="fas fa-file-export"></i> Export
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                            {history.map((h, i) => {
                                const hInfo = POSTURES[h.posture] || POSTURES['Not detected yet'];
                                return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: h.posture === 'Fell Down' ? 'rgba(255,77,77,0.1)' : 'rgba(255,255,255,0.03)', borderRadius: '10px', border: `1px solid ${h.posture === 'Fell Down' ? '#ff4d4d44' : 'rgba(255,255,255,0.05)'}`, transition: 'all 0.3s' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <i className={`fas ${hInfo.icon}`} style={{ color: hInfo.color, width: '18px', textAlign: 'center' }}></i>
                                            <span style={{ fontWeight: '600', color: hInfo.color }}>{h.posture}</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.time}</span>
                                    </div>
                                );
                            })}
                            {history.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '30px 0' }}>Awaiting AI inference...</p>
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
                @keyframes fell-pulse {
                    from { box-shadow: 0 0 20px rgba(255,77,77,0.3); }
                    to   { box-shadow: 0 0 60px rgba(255,77,77,0.7); }
                }
            `}</style>
        </div>
    );
};

export default PostureMonitor;
